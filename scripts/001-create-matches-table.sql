-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('singles', 'doubles')),
    player1 VARCHAR(255) NOT NULL,
    player2 VARCHAR(255) NOT NULL,
    player3 VARCHAR(255),
    player4 VARCHAR(255),
    score1 INTEGER DEFAULT 0,
    score2 INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active matches
CREATE INDEX IF NOT EXISTS idx_matches_active ON matches(is_active) WHERE is_active = true;
