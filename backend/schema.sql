CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY, -- Google ID
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Themes (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    images JSON, -- Array of image URLs
    cover_image TEXT,
    settings JSON NOT NULL, -- Theme settings data
    custom_styleshift JSON, -- Custom styleshift items
    is_public BOOLEAN DEFAULT TRUE,
    downloads INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES Users(id)
);

CREATE INDEX IF NOT EXISTS idx_themes_owner ON Themes(owner_id);
CREATE INDEX IF NOT EXISTS idx_themes_public ON Themes(is_public);

CREATE TABLE IF NOT EXISTS Uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON Uploads(user_id);