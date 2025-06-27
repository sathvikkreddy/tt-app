import { neon } from "@neondatabase/serverless"

/**
 * A singleton SQL client that also guarantees the schema exists.
 */
const sql = neon(process.env.DATABASE_URL!)

let schemaReady = false

async function ensureSchema() {
  if (schemaReady) return
  // Create table & index if they don’t exist
  await sql`CREATE TABLE IF NOT EXISTS matches (
      id          serial PRIMARY KEY,
      type        varchar(10) NOT NULL CHECK (type IN ('singles','doubles')),
      player1     varchar(255) NOT NULL,
      player2     varchar(255) NOT NULL,
      player3     varchar(255),
      player4     varchar(255),
      score1      integer      DEFAULT 0,
      score2      integer      DEFAULT 0,
      is_active   boolean      DEFAULT true,
      created_at  timestamp    DEFAULT CURRENT_TIMESTAMP,
      updated_at  timestamp    DEFAULT CURRENT_TIMESTAMP
  );`
  await sql`CREATE INDEX IF NOT EXISTS idx_matches_active ON matches(is_active) WHERE is_active = true;`
  schemaReady = true
}

/**
 * Call this in every route to get a schema-safe sql client.
 */
export async function getSql() {
  await ensureSchema()
  return sql
}
