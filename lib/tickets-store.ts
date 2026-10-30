import fs from "fs";
import path from "path";
import { getDbPool, TicketRow } from "./db";

const LOCAL_STORE_PATH = path.join(process.cwd(), "data", "tickets-store.json");

// In-memory cache to guarantee persistence across requests within the process
let inMemoryTickets: TicketRow[] = [];

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLocalTickets(): TicketRow[] {
  if (inMemoryTickets.length > 0) {
    return inMemoryTickets;
  }
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const data = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
      inMemoryTickets = JSON.parse(data);
      return inMemoryTickets;
    }
  } catch (err) {
    console.error("[OpsPilot Local Tickets] Read error:", err);
  }
  return inMemoryTickets;
}

function writeLocalTickets(tickets: TicketRow[]) {
  inMemoryTickets = tickets;
  try {
    ensureDirectoryExists(LOCAL_STORE_PATH);
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(tickets, null, 2), "utf-8");
  } catch (err) {
    // Retain in memory even if disk write has sandbox permissions
  }
}

export async function saveApprovedTicket(data: {
  machine: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  sourceChunkIds: number[];
  operatorName: string;
}): Promise<TicketRow> {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      const pool = getDbPool();
      const res = await pool.query(
        `INSERT INTO tickets 
          (machine, title, description, priority, status, source_chunk_ids, approved_by, decided_at)
         VALUES ($1, $2, $3, $4, 'approved', $5, $6, NOW())
         RETURNING *;`,
        [
          data.machine,
          data.title,
          data.description,
          data.priority,
          data.sourceChunkIds,
          data.operatorName,
        ]
      );
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (dbErr: any) {
      console.warn(
        "[OpsPilot Tickets] Postgres insert failed, falling back to local file store:",
        dbErr.message
      );
    }
  }

  // Fallback to local file store
  const existing = readLocalTickets();
  const nextId = existing.length > 0 ? Math.max(...existing.map((t) => t.id)) + 1 : 101;
  const now = new Date().toISOString();

  const newTicket: TicketRow = {
    id: nextId,
    machine: data.machine,
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: "approved",
    source_chunk_ids: data.sourceChunkIds,
    approved_by: data.operatorName,
    created_at: now,
    decided_at: now,
  };

  existing.unshift(newTicket);
  writeLocalTickets(existing);
  return newTicket;
}

export async function saveRejectedTicket(data: {
  machine: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  sourceChunkIds?: number[];
  operatorName?: string;
  reason?: string;
}): Promise<TicketRow> {
  const dbUrl = process.env.DATABASE_URL;
  const priority = data.priority || "medium";
  const desc = data.description || "Draft discarded by operator";
  const operator = data.operatorName || "Operator 1";
  const sourceIds = data.sourceChunkIds || [];

  if (dbUrl) {
    try {
      const pool = getDbPool();
      const res = await pool.query(
        `INSERT INTO tickets 
          (machine, title, description, priority, status, source_chunk_ids, approved_by, decided_at)
         VALUES ($1, $2, $3, $4, 'rejected', $5, $6, NOW())
         RETURNING *;`,
        [data.machine, data.title, desc, priority, sourceIds, operator]
      );
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (dbErr: any) {
      console.warn(
        "[OpsPilot Tickets] Postgres reject insert failed, falling back to local file store:",
        dbErr.message
      );
    }
  }

  // Fallback to local file store
  const existing = readLocalTickets();
  const nextId = existing.length > 0 ? Math.max(...existing.map((t) => t.id)) + 1 : 101;
  const now = new Date().toISOString();

  const rejectedTicket: TicketRow = {
    id: nextId,
    machine: data.machine,
    title: data.title,
    description: desc,
    priority,
    status: "rejected",
    source_chunk_ids: sourceIds,
    approved_by: operator,
    created_at: now,
    decided_at: now,
  };

  existing.unshift(rejectedTicket);
  writeLocalTickets(existing);
  return rejectedTicket;
}

export async function listAllTickets(): Promise<TicketRow[]> {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      const pool = getDbPool();
      const res = await pool.query(
        `SELECT id, machine, title, description, priority, status, source_chunk_ids, approved_by, created_at, decided_at
         FROM tickets
         ORDER BY created_at DESC;`
      );
      return res.rows;
    } catch (dbErr: any) {
      console.warn(
        "[OpsPilot Tickets] Postgres select failed, falling back to local file store:",
        dbErr.message
      );
    }
  }

  return readLocalTickets();
}
