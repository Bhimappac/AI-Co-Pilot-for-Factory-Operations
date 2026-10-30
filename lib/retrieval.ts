import fs from "fs";
import path from "path";
import dns from "dns";
import dotenv from "dotenv";
import { embed } from "ai";
import { getEmbeddingModel, validateEmbeddingEnv } from "./models";
import { getDbPool } from "./db";

function isHostResolvable(hostname: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      resolve(!err && !!address);
    });
  });
}

dotenv.config();
dotenv.config({ path: ".env.local" });

export interface RetrievedChunk {
  chunkId: number;
  title: string;
  section: string;
  content: string;
  similarity: number;
}

// Fallback memory cache for offline development or testing without remote DB
let cachedProcedures: Array<{
  id: number;
  title: string;
  section: string;
  content: string;
  embedding: number[];
}> | null = null;

function loadLocalProceduresCache() {
  if (cachedProcedures) return cachedProcedures;
  const cachePath = path.join(process.cwd(), "data", "procedures-cache.json");
  if (fs.existsSync(cachePath)) {
    try {
      const data = fs.readFileSync(cachePath, "utf-8");
      cachedProcedures = JSON.parse(data);
      return cachedProcedures;
    } catch {
      return null;
    }
  }
  return null;
}

function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
  "by", "can", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from",
  "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
  "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
  "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
  "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same", "she", "should",
  "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
  "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "with", "would", "you", "your", "yours", "yourself", "yourselves"
]);

// Keyword-based relevance heuristic for fallback when vector models are offline
function keywordRelevanceScore(query: string, item: { title: string; section: string; content: string }): number {
  const rawTerms = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  if (rawTerms.length === 0) return 0;

  const lowerTitle = item.title.toLowerCase();
  const lowerSec = item.section.toLowerCase();
  const lowerContent = item.content.toLowerCase();

  let matchedWeight = 0;
  let totalWeight = 0;

  for (const term of rawTerms) {
    const termWeight = 1.0;
    totalWeight += termWeight;

    // Check stem/prefix
    const stem = term.endsWith("ing") ? term.slice(0, -3) : term.endsWith("ed") ? term.slice(0, -2) : term;

    if (lowerTitle.includes(term) || (stem.length > 3 && lowerTitle.includes(stem))) {
      matchedWeight += 1.5; // Title match gives high boost
    } else if (lowerSec.includes(term) || (stem.length > 3 && lowerSec.includes(stem))) {
      matchedWeight += 1.2; // Section match boost
    } else if (lowerContent.includes(term) || (stem.length > 3 && lowerContent.includes(stem))) {
      matchedWeight += 0.8;
    }
  }

  const fractionMatched = matchedWeight / totalWeight;

  // If less than 25% of substantive terms matched, reject as irrelevant
  if (fractionMatched < 0.25) {
    return 0;
  }

  // Scale between 0.45 and 0.95
  return Math.min(0.95, 0.45 + (fractionMatched / 1.5) * 0.5);
}

export async function searchChunks(
  userQuery: string,
  k: number = 4
): Promise<RetrievedChunk[]> {
  const threshold = parseFloat(process.env.SIMILARITY_THRESHOLD || "0.4");
  const dbUrl = process.env.DATABASE_URL;

  if (!userQuery || userQuery.trim().length === 0) {
    return [];
  }

  let queryEmbedding: number[] | null = null;
  const embCheck = validateEmbeddingEnv();

  if (embCheck.valid) {
    const rawProvider = (process.env.EMBEDDING_PROVIDER || "google").toLowerCase();
    let isHostOnline = false;
    if (rawProvider === "ollama") {
      isHostOnline = true;
    } else {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        let testUrl = "";
        if (rawProvider === "google") {
          const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
          testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        } else if (rawProvider === "voyage") {
          testUrl = "https://api.voyageai.com";
        } else if (rawProvider === "openai") {
          testUrl = "https://api.openai.com/v1/models";
        }
        const res = await fetch(testUrl, { signal: controller.signal }).catch(() => null);
        clearTimeout(timeout);
        isHostOnline = res !== null && res.ok;
      } catch {
        isHostOnline = false;
      }
    }

    if (isHostOnline) {
      try {
        const model = getEmbeddingModel();
        const res = await embed({
          model,
          value: userQuery,
        });
        queryEmbedding = res.embedding;
      } catch (e: any) {
        console.warn("[OpsPilot Retrieval] Embedding generation error:", e.message);
      }
    }
  }

  // Attempt database retrieval via pgvector if DATABASE_URL is set
  if (dbUrl && queryEmbedding) {
    try {
      const pool = getDbPool();
      const vectorStr = `[${queryEmbedding.join(",")}]`;

      const sql = `
        SELECT 
          chunks.id AS "chunkId",
          documents.title AS "title",
          chunks.section AS "section",
          chunks.content AS "content",
          1 - (chunks.embedding <=> $1::vector) AS similarity
        FROM chunks
        JOIN documents ON chunks.document_id = documents.id
        WHERE chunks.embedding IS NOT NULL
          AND (1 - (chunks.embedding <=> $1::vector)) >= $2
        ORDER BY similarity DESC
        LIMIT $3;
      `;

      const result = await pool.query(sql, [vectorStr, threshold, k]);

      return result.rows.map((row: any) => ({
        chunkId: Number(row.chunkId),
        title: String(row.title),
        section: String(row.section),
        content: String(row.content),
        similarity: parseFloat(Number(row.similarity).toFixed(4)),
      }));
    } catch (dbErr: any) {
      console.warn(
        "[OpsPilot Retrieval] DB query failed, falling back to local memory index:",
        dbErr.message
      );
    }
  }

  // Local fallback: search against procedures-cache.json or markdown files
  const cache = loadLocalProceduresCache();
  if (cache && cache.length > 0) {
    const scored = cache
      .map((item) => {
        let sim = 0;
        if (queryEmbedding && item.embedding && item.embedding.length > 0) {
          sim = calculateCosineSimilarity(queryEmbedding, item.embedding);
        } else {
          // Keyword score fallback
          sim = keywordRelevanceScore(userQuery, item);
        }

        return {
          chunkId: item.id,
          title: item.title,
          section: item.section,
          content: item.content,
          similarity: parseFloat(sim.toFixed(4)),
        };
      })
      .filter((r) => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    return scored;
  }

  return [];
}
