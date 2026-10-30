import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { embedMany } from "ai";
import { getEmbeddingModel, validateEmbeddingEnv } from "../lib/models";
import { getDbPool } from "../lib/db";

// Load environment variables
dotenv.config();
dotenv.config({ path: ".env.local" });

interface ProcedureChunk {
  documentTitle: string;
  section: string;
  content: string;
}

function splitIntoChunks(text: string, maxWords = 400, overlap = 50): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return [text.trim()];
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start += maxWords - overlap;
  }
  return chunks;
}

function parseMarkdownProcedure(filePath: string): { title: string; chunks: { section: string; content: string }[] } {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split("\n");

  let title = path.basename(filePath, ".md");
  // Find top level # title if present
  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.replace("# ", "").trim();
      break;
    }
  }

  const chunks: { section: string; content: string }[] = [];

  // Split by ## sections
  const rawSections = fileContent.split(/\n(?=##\s+)/);

  for (const rawSec of rawSections) {
    const trimmed = rawSec.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      const headingEnd = trimmed.indexOf("\n");
      const sectionHeader = headingEnd !== -1 
        ? trimmed.substring(3, headingEnd).trim() 
        : trimmed.substring(3).trim();
      
      const body = headingEnd !== -1 ? trimmed.substring(headingEnd).trim() : "";
      
      // If body is long, split with overlap
      const splitBodies = splitIntoChunks(body, 400, 50);
      splitBodies.forEach((subBody, idx) => {
        const sectionName = splitBodies.length > 1 
          ? `${sectionHeader} (Part ${idx + 1})` 
          : sectionHeader;
        chunks.push({
          section: sectionName,
          content: `${sectionHeader}\n${subBody}`,
        });
      });
    } else if (trimmed.startsWith("# ")) {
      // Preamble before first ##
      const headingEnd = trimmed.indexOf("\n");
      const body = headingEnd !== -1 ? trimmed.substring(headingEnd).trim() : "";
      if (body) {
        chunks.push({
          section: "Overview",
          content: body,
        });
      }
    }
  }

  return { title, chunks };
}

async function runIngestion() {
  console.log("==========================================");
  console.log("OpsPilot Document Ingestion Pipeline");
  console.log("==========================================");

  const proceduresDir = path.join(process.cwd(), "data", "procedures");
  if (!fs.existsSync(proceduresDir)) {
    console.error(`Procedures directory not found at ${proceduresDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(proceduresDir).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} procedure markdown files in data/procedures/`);

  const allChunks: ProcedureChunk[] = [];
  const parsedDocs: { title: string; chunks: { section: string; content: string }[] }[] = [];

  for (const file of files) {
    const fullPath = path.join(proceduresDir, file);
    const parsed = parseMarkdownProcedure(fullPath);
    parsedDocs.push(parsed);

    for (const chunk of parsed.chunks) {
      allChunks.push({
        documentTitle: parsed.title,
        section: chunk.section,
        content: chunk.content,
      });
    }
  }

  console.log(`Total parsed document sections to index: ${allChunks.length}`);

  const embeddingDim = parseInt(process.env.EMBEDDING_DIM || "768", 10);
  const embeddingProvider = process.env.EMBEDDING_PROVIDER || "google";
  const embeddingModelName = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
  const databaseUrl = process.env.DATABASE_URL;

  console.log(`Configured Embedding Provider: ${embeddingProvider} (${embeddingModelName})`);
  console.log(`Configured Vector Dimension: ${embeddingDim}`);

  let embeddings: number[][] = [];
  const embCheck = validateEmbeddingEnv();

  if (embCheck.valid) {
    console.log(`Generating vector embeddings using ${embeddingProvider} (${embeddingModelName})...`);
    try {
      const textValues = allChunks.map(
        (c) => `Document: ${c.documentTitle}\nSection: ${c.section}\n\n${c.content}`
      );
      
      const model = getEmbeddingModel();
      const res = await embedMany({
        model,
        values: textValues,
      });
      embeddings = res.embeddings;
      console.log(`✅ Generated ${embeddings.length} embeddings (dimension: ${embeddings[0]?.length || embeddingDim})`);
    } catch (embErr: any) {
      console.warn("⚠️ Warning: Failed to generate embeddings:", embErr.message);
      console.warn("Generating mock fallback embeddings for offline capability...");
      embeddings = allChunks.map(() => new Array(embeddingDim).fill(0).map(() => (Math.random() - 0.5) * 0.1));
    }
  } else {
    console.warn(`⚠️ Warning: ${embCheck.message}`);
    console.warn("Generating mock fallback embeddings for offline testing...");
    embeddings = allChunks.map(() => new Array(embeddingDim).fill(0).map(() => (Math.random() - 0.5) * 0.1));
  }

  // Also write an offline local cache for fast test runners and resilience
  const cacheFile = path.join(process.cwd(), "data", "procedures-cache.json");
  const cacheData = allChunks.map((c, i) => ({
    id: i + 1,
    title: c.documentTitle,
    section: c.section,
    content: c.content,
    embedding: embeddings[i] || [],
  }));
  fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), "utf-8");
  console.log(`💾 Saved offline cache copy to ${cacheFile}`);

  // Ingest into PostgreSQL if DATABASE_URL is configured
  if (!databaseUrl) {
    console.log("ℹ️ No DATABASE_URL configured. Chunks saved to local cache. Ingestion complete.");
    return;
  }

  console.log("Connecting to PostgreSQL to insert documents and chunks...");
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    let chunkIdx = 0;
    for (const doc of parsedDocs) {
      // Idempotent: check if document exists
      const existingDocRes = await client.query(
        "SELECT id FROM documents WHERE title = $1 LIMIT 1;",
        [doc.title]
      );

      let docId: number;
      if (existingDocRes.rows.length > 0) {
        docId = existingDocRes.rows[0].id;
        // Clean out old chunks for this document
        await client.query("DELETE FROM chunks WHERE document_id = $1;", [docId]);
        console.log(`  ↻ Updating existing document [ID ${docId}]: "${doc.title}"`);
      } else {
        const insertDocRes = await client.query(
          "INSERT INTO documents (title, doc_type) VALUES ($1, 'procedure') RETURNING id;",
          [doc.title]
        );
        docId = insertDocRes.rows[0].id;
        console.log(`  + Inserted new document [ID ${docId}]: "${doc.title}"`);
      }

      // Insert each chunk with its vector embedding
      for (const chunk of doc.chunks) {
        const emb = embeddings[chunkIdx];
        chunkIdx++;

        const vectorString = emb ? `[${emb.join(",")}]` : null;

        await client.query(
          "INSERT INTO chunks (document_id, section, content, embedding) VALUES ($1, $2, $3, $4::vector);",
          [docId, chunk.section, chunk.content, vectorString]
        );
      }
    }

    await client.query("COMMIT;");
    console.log("✅ Idempotent database ingestion completed successfully!");
  } catch (dbErr: any) {
    await client.query("ROLLBACK;");
    console.error("❌ Database ingestion failed:", dbErr.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runIngestion().catch((err) => {
  console.error("Fatal error during ingestion:", err);
  process.exit(1);
});
