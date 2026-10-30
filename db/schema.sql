-- OpsPilot Database Schema
-- Requires pgvector extension enabled

CREATE EXTENSION IF NOT EXISTS vector;

-- Approved operational and procedure documents
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'procedure',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chunked sections with vector embeddings for semantic retrieval
CREATE TABLE IF NOT EXISTS chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768)
);

-- HNSW Cosine Index for high-speed nearest-neighbor retrieval
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx 
ON chunks USING hnsw (embedding vector_cosine_ops);

-- Human-in-the-loop maintenance tickets
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    machine TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    source_chunk_ids INTEGER[],
    approved_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);

-- Index tickets for fast audit trail queries
CREATE INDEX IF NOT EXISTS tickets_created_at_idx ON tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets (status);
