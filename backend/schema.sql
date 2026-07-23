CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY, -- Google ID
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON Sessions(user_id);

CREATE TABLE IF NOT EXISTS Themes (
    theme_id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    theme_name TEXT NOT NULL,
    description TEXT,
    images JSON, -- Array of image URLs
    cover_image TEXT,
    settings JSON NOT NULL, -- Theme settings data
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

-- Existing D1 databases created before 2026-07-23 need this additive,
-- one-time migration before deploying the tables below. SQLite/D1 has no
-- `ADD COLUMN IF NOT EXISTS`, so do not run this statement after it succeeds.
-- ALTER TABLE Users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS Categories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Tags (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Starter taxonomy keeps creation and discovery useful before the community
-- has added its own categories and tags. These inserts are safe to rerun.
INSERT OR IGNORE INTO Categories (id, slug, name) VALUES
    ('category-gaming', 'gaming', 'Gaming'),
    ('category-entertainment', 'entertainment', 'Entertainment'),
    ('category-music', 'music', 'Music'),
    ('category-productivity', 'productivity', 'Productivity'),
    ('category-education', 'education', 'Education'),
    ('category-technology', 'technology', 'Technology'),
    ('category-news', 'news', 'News'),
    ('category-lifestyle', 'lifestyle', 'Lifestyle');

INSERT OR IGNORE INTO Tags (id, slug, name) VALUES
    ('tag-dark-mode', 'dark-mode', 'Dark Mode'),
    ('tag-minimal', 'minimal', 'Minimal'),
    ('tag-colorful', 'colorful', 'Colorful'),
    ('tag-retro', 'retro', 'Retro'),
    ('tag-anime', 'anime', 'Anime'),
    ('tag-gaming', 'gaming', 'Gaming'),
    ('tag-music', 'music', 'Music'),
    ('tag-focus', 'focus', 'Focus'),
    ('tag-accessibility', 'accessibility', 'Accessibility'),
    ('tag-high-contrast', 'high-contrast', 'High Contrast'),
    ('tag-oled', 'oled', 'OLED'),
    ('tag-pastel', 'pastel', 'Pastel');

CREATE TABLE IF NOT EXISTS ThemeTags (
    theme_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (theme_id, tag_id),
    FOREIGN KEY (theme_id) REFERENCES Themes(theme_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_theme_tags_tag ON ThemeTags(tag_id);

CREATE TABLE IF NOT EXISTS ThemeCategories (
    theme_id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES Themes(theme_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_theme_categories_category ON ThemeCategories(category_id);

CREATE TABLE IF NOT EXISTS ThemeVersions (
    id TEXT PRIMARY KEY,
    theme_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    theme_name TEXT NOT NULL,
    description TEXT,
    images JSON,
    cover_image TEXT,
    settings JSON NOT NULL,
    is_public BOOLEAN NOT NULL,
    tags JSON NOT NULL DEFAULT '[]',
    category JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (theme_id, version_number),
    FOREIGN KEY (theme_id) REFERENCES Themes(theme_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_theme_versions_theme ON ThemeVersions(theme_id, version_number DESC);

CREATE TABLE IF NOT EXISTS Reviews (
    id TEXT PRIMARY KEY,
    theme_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (theme_id, user_id),
    FOREIGN KEY (theme_id) REFERENCES Themes(theme_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reviews_theme ON Reviews(theme_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON Reviews(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ThemeReports (
    id TEXT PRIMARY KEY,
    theme_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    resolved_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES Themes(theme_id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES Users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_theme_reports_reporter ON ThemeReports(reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_theme_reports_moderation ON ThemeReports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS Collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_collections_user ON Collections(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS CollectionItems (
    collection_id TEXT NOT NULL,
    theme_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, theme_id),
    FOREIGN KEY (collection_id) REFERENCES Collections(id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES Themes(theme_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_collection_items_theme ON CollectionItems(theme_id);
