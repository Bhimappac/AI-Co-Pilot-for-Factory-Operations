import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { getDbPool } from "../lib/db";

// Load environment configuration
dotenv.config();
dotenv.config({ path: ".env.local" });

async function runMigration() {
  console.log("==========================================");
  console.log("OpsPilot Database Migration (pgvector)");
  console.log("==========================================");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is missing.");
    console.error("Please configure DATABASE_URL in .env.local or your environment.");
    process.exit(1);
  }

  const embeddingDim = process.env.EMBEDDING_DIM || "768";
  console.log(`Configured Vector Dimension: ${embeddingDim}`);

  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error(`ERROR: Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  let schemaSql = fs.readFileSync(schemaPath, "utf-8");
  // Replace vector dimension if specified
  schemaSql = schemaSql.replace(/vector\(768\)/g, `vector(${embeddingDim})`);

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    console.log("Connected to PostgreSQL. Applying schema migration...");
    await client.query("BEGIN;");
    await client.query(schemaSql);
    await client.query("COMMIT;");
    console.log("✅ Schema migration successfully applied!");
    console.log("   - vector extension verified");
    console.log("   - documents table created");
    console.log(`   - chunks table created with vector(${embeddingDim})`);
    console.log("   - chunks HNSW cosine index created");
    console.log("   - tickets audit table created");
  } catch (err: any) {
    await client.query("ROLLBACK;");
    console.error("❌ Migration failed with error:", err.message);
    if (err.message.includes("extension \"vector\" is not available")) {
      console.error(
        "\nTIP: The pgvector extension must be enabled on your PostgreSQL instance.\n" +
        "On Neon or Supabase, vector is available out of the box.\n" +
        "On local PostgreSQL, run: sudo apt install postgresql-xx-pgvector"
      );
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error("Fatal error running migration:", err);
  process.exit(1);
});
