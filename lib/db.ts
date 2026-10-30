import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables for scripts or Next.js
dotenv.config();
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

// Reusable pg Pool instance
let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    if (!connectionString) {
      console.warn(
        "[OpsPilot DB] Warning: DATABASE_URL is not defined in environment variables. Database queries may fail if no active DB is configured."
      );
    }

    const isLocalhost =
      connectionString?.includes("localhost") ||
      connectionString?.includes("127.0.0.1");

    pool = new Pool({
      connectionString,
      ssl: isLocalhost || !connectionString ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("[OpsPilot DB] Unexpected idle client error:", err);
    });
  }

  return pool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return {
    rows: res.rows as T[],
    rowCount: res.rowCount,
  };
}

export interface DocumentRow {
  id: number;
  title: string;
  doc_type: string;
  created_at: Date;
}

export interface ChunkRow {
  id: number;
  document_id: number;
  section: string;
  content: string;
  embedding?: string | number[];
}

export interface TicketRow {
  id: number;
  machine: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "draft" | "approved" | "rejected";
  source_chunk_ids: number[] | null;
  approved_by: string | null;
  created_at: string;
  decided_at: string | null;
}
