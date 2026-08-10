use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbTrack {
    pub id: String,
    pub file_path: String,
    pub file_hash: Option<String>,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub album_artist: Option<String>,
    pub genre: Option<String>,
    pub year: Option<i64>,
    pub track_number: Option<i64>,
    pub duration: f64,
    pub file_name: String,
    pub file_size: i64,
    pub format: String,
    pub artwork_path: Option<String>,
    pub date_added: i64,
    pub liked: bool,
    pub play_count: i64,
    pub is_missing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbTrackInput {
    pub id: Option<String>,
    pub file_path: String,
    pub file_hash: Option<String>,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub album_artist: Option<String>,
    pub genre: Option<String>,
    pub year: Option<i64>,
    pub track_number: Option<i64>,
    pub duration: f64,
    pub file_name: String,
    pub file_size: i64,
    pub format: String,
    pub artwork_path: Option<String>,
    pub date_added: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbPlaylist {
    pub id: String,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub track_count: i64,
    pub artwork_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbPlaylistDetail {
    pub id: String,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub tracks: Vec<DbTrack>,
}

pub fn compute_file_sha256(path: &Path) -> Option<String> {
    let mut file = fs::File::open(path).ok()?;
    let mut hasher = Sha256::new();
    std::io::copy(&mut file, &mut hasher).ok()?;
    Some(format!("{:x}", hasher.finalize()))
}

pub struct DatabaseManager {
    db_path: PathBuf,
}

impl DatabaseManager {
    pub fn new(app_data_dir: &Path) -> Result<Self, String> {
        if !app_data_dir.exists() {
            fs::create_dir_all(app_data_dir)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }
        let db_path = app_data_dir.join("aurora.db");
        let manager = Self { db_path };
        manager.run_migrations()?;
        Ok(manager)
    }

    pub fn get_connection(&self) -> Result<Connection, String> {
        Connection::open(&self.db_path)
            .map_err(|e| format!("Failed to open SQLite database: {}", e))
    }

    fn run_migrations(&self) -> Result<(), String> {
        let conn = self.get_connection()?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS _migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );",
            [],
        )
        .map_err(|e| format!("Failed to create _migrations table: {}", e))?;

        // Migration 1: Initial Tracks Table
        let migration_1_applied: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM _migrations WHERE version = 1)",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !migration_1_applied {
            conn.execute(
                "CREATE TABLE IF NOT EXISTS tracks (
                    id TEXT PRIMARY KEY,
                    file_path TEXT UNIQUE NOT NULL,
                    title TEXT,
                    artist TEXT,
                    album TEXT,
                    album_artist TEXT,
                    genre TEXT,
                    year INTEGER,
                    track_number INTEGER,
                    duration REAL NOT NULL DEFAULT 0,
                    file_name TEXT NOT NULL,
                    file_size INTEGER NOT NULL DEFAULT 0,
                    format TEXT NOT NULL,
                    artwork_path TEXT,
                    date_added INTEGER NOT NULL,
                    liked INTEGER NOT NULL DEFAULT 0,
                    play_count INTEGER NOT NULL DEFAULT 0,
                    is_missing INTEGER NOT NULL DEFAULT 0
                );",
                [],
            )
            .map_err(|e| format!("Migration 1 failed to create tracks table: {}", e))?;

            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_tracks_file_path ON tracks(file_path);",
                [],
            )
            .map_err(|e| format!("Migration 1 failed to create file_path index: {}", e))?;

            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_tracks_date_added ON tracks(date_added);",
                [],
            )
            .map_err(|e| format!("Migration 1 failed to create date_added index: {}", e))?;

            conn.execute(
                "INSERT INTO _migrations (version, applied_at) VALUES (1, datetime('now'));",
                [],
            )
            .map_err(|e| format!("Failed to record Migration 1: {}", e))?;
        }

        // Migration 2: Add file_hash for moved file reconciliation
        let migration_2_applied: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM _migrations WHERE version = 2)",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !migration_2_applied {
            let has_column: bool = conn
                .query_row(
                    "SELECT COUNT(*) FROM pragma_table_info('tracks') WHERE name='file_hash'",
                    [],
                    |row| row.get::<_, i64>(0).map(|c| c > 0),
                )
                .unwrap_or(false);

            if !has_column {
                conn.execute("ALTER TABLE tracks ADD COLUMN file_hash TEXT;", [])
                    .map_err(|e| format!("Migration 2 failed to add file_hash column: {}", e))?;
            }

            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_tracks_file_hash ON tracks(file_hash);",
                [],
            )
            .map_err(|e| format!("Migration 2 failed to create file_hash index: {}", e))?;

            // Backfill file_hash for existing records whose file currently exists on disk
            let mut stmt = conn
                .prepare("SELECT id, file_path FROM tracks WHERE file_hash IS NULL")
                .map_err(|e| format!("Failed to prepare backfill query: {}", e))?;

            let rows: Vec<(String, String)> = stmt
                .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
                .map_err(|e| format!("Query map backfill error: {}", e))?
                .filter_map(|r| r.ok())
                .collect();

            for (id, path) in rows {
                let p = Path::new(&path);
                if p.exists() {
                    if let Some(hash) = compute_file_sha256(p) {
                        let _ = conn.execute(
                            "UPDATE tracks SET file_hash = ?1 WHERE id = ?2",
                            params![hash, id],
                        );
                    }
                }
            }

            conn.execute(
                "INSERT INTO _migrations (version, applied_at) VALUES (2, datetime('now'));",
                [],
            )
            .map_err(|e| format!("Failed to record Migration 2: {}", e))?;
        }

        // Migration 3: Add Playlists and Playlist_Tracks Junction Table
        let migration_3_applied: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM _migrations WHERE version = 3)",
                [],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !migration_3_applied {
            conn.execute(
                "CREATE TABLE IF NOT EXISTS playlists (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );",
                [],
            )
            .map_err(|e| format!("Migration 3 failed to create playlists table: {}", e))?;

            conn.execute(
                "CREATE TABLE IF NOT EXISTS playlist_tracks (
                    playlist_id TEXT NOT NULL,
                    track_id TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    added_at INTEGER NOT NULL,
                    PRIMARY KEY (playlist_id, track_id),
                    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
                );",
                [],
            )
            .map_err(|e| format!("Migration 3 failed to create playlist_tracks table: {}", e))?;

            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_playlist_tracks_pos ON playlist_tracks(playlist_id, position);",
                [],
            )
            .map_err(|e| format!("Migration 3 failed to create playlist_tracks position index: {}", e))?;

            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);",
                [],
            )
            .map_err(|e| format!("Migration 3 failed to create playlist_tracks track index: {}", e))?;

            conn.execute(
                "INSERT INTO _migrations (version, applied_at) VALUES (3, datetime('now'));",
                [],
            )
            .map_err(|e| format!("Failed to record Migration 3: {}", e))?;
        }

        Ok(())
    }

    pub fn save_tracks(&self, inputs: Vec<DbTrackInput>) -> Result<Vec<DbTrack>, String> {
        let mut conn = self.get_connection()?;
        let tx = conn
            .transaction()
            .map_err(|e| format!("Failed to start transaction: {}", e))?;

        let mut saved_tracks = Vec::new();
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;

        for input in inputs {
            let path_obj = Path::new(&input.file_path);
            let computed_hash = input.file_hash.or_else(|| compute_file_sha256(path_obj));

            // Step 1: Check by exact file_path OR legacy unrooted filename
            let existing_by_path: Option<(String, i64, bool, i64, Option<String>, Option<String>)> = tx
                .query_row(
                    "SELECT id, date_added, liked, play_count, artwork_path, file_hash FROM tracks WHERE file_path = ?1 OR (file_name = ?2 AND file_path = ?2)",
                    params![input.file_path, input.file_name],
                    |row| {
                        Ok((
                            row.get(0)?,
                            row.get(1)?,
                            row.get::<_, i64>(2)? == 1,
                            row.get(3)?,
                            row.get(4)?,
                            row.get(5)?,
                        ))
                    },
                )
                .optional()
                .map_err(|e| format!("Query existing track by path error: {}", e))?;

            // Step 2: If not found by path, check by content file_hash to reconcile MOVED files
            let existing = match existing_by_path {
                Some(found) => Some(found),
                None => {
                    if let Some(ref hash) = computed_hash {
                        let candidate: Option<(String, i64, bool, i64, Option<String>, Option<String>, String)> = tx
                            .query_row(
                                "SELECT id, date_added, liked, play_count, artwork_path, file_hash, file_path FROM tracks WHERE file_hash = ?1",
                                params![hash],
                                |row| {
                                    Ok((
                                        row.get(0)?,
                                        row.get(1)?,
                                        row.get::<_, i64>(2)? == 1,
                                        row.get(3)?,
                                        row.get(4)?,
                                        row.get(5)?,
                                        row.get(6)?,
                                    ))
                                },
                            )
                            .optional()
                            .map_err(|e| format!("Query existing track by hash error: {}", e))?;

                        if let Some((ex_id, ex_date, ex_liked, ex_plays, ex_art, ex_hash, old_path)) = candidate {
                            if !Path::new(&old_path).exists() || old_path != input.file_path {
                                Some((ex_id, ex_date, ex_liked, ex_plays, ex_art, ex_hash))
                            } else {
                                None
                            }
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                }
            };

            let final_hash = computed_hash;

            let (id, date_added, liked, play_count, final_artwork_path) = match existing {
                Some((ex_id, ex_date_added, ex_liked, ex_play_count, ex_artwork_path, _)) => {
                    let art = if input.artwork_path.is_some() {
                        input.artwork_path.clone()
                    } else {
                        ex_artwork_path
                    };

                    tx.execute(
                        "UPDATE tracks SET
                            file_path = ?1,
                            file_hash = ?2,
                            title = ?3,
                            artist = ?4,
                            album = ?5,
                            album_artist = ?6,
                            genre = ?7,
                            year = ?8,
                            track_number = ?9,
                            duration = ?10,
                            file_name = ?11,
                            file_size = ?12,
                            format = ?13,
                            artwork_path = ?14,
                            is_missing = 0
                        WHERE id = ?15",
                        params![
                            input.file_path,
                            final_hash,
                            input.title,
                            input.artist,
                            input.album,
                            input.album_artist,
                            input.genre,
                            input.year,
                            input.track_number,
                            input.duration,
                            input.file_name,
                            input.file_size,
                            input.format,
                            art,
                            ex_id
                        ],
                    )
                    .map_err(|e| format!("Failed to update track {}: {}", ex_id, e))?;

                    (ex_id, ex_date_added, ex_liked, ex_play_count, art)
                }
                None => {
                    let new_id = input.id.unwrap_or_else(|| {
                        format!("track_{}_{}", now, fastrand_u32())
                    });
                    let date = input.date_added.unwrap_or(now);

                    tx.execute(
                        "INSERT INTO tracks (
                            id, file_path, file_hash, title, artist, album, album_artist,
                            genre, year, track_number, duration, file_name, file_size,
                            format, artwork_path, date_added, liked, play_count, is_missing
                        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, 0, 0, 0)",
                        params![
                            new_id,
                            input.file_path,
                            final_hash,
                            input.title,
                            input.artist,
                            input.album,
                            input.album_artist,
                            input.genre,
                            input.year,
                            input.track_number,
                            input.duration,
                            input.file_name,
                            input.file_size,
                            input.format,
                            input.artwork_path,
                            date
                        ],
                    )
                    .map_err(|e| format!("Failed to insert track {}: {}", input.file_path, e))?;

                    (new_id, date, false, 0, input.artwork_path.clone())
                }
            };

            let is_missing = !Path::new(&input.file_path).exists();

            saved_tracks.push(DbTrack {
                id,
                file_path: input.file_path,
                file_hash: final_hash,
                title: input.title,
                artist: input.artist,
                album: input.album,
                album_artist: input.album_artist,
                genre: input.genre,
                year: input.year,
                track_number: input.track_number,
                duration: input.duration,
                file_name: input.file_name,
                file_size: input.file_size,
                format: input.format,
                artwork_path: final_artwork_path,
                date_added,
                liked,
                play_count,
                is_missing,
            });
        }

        tx.commit()
            .map_err(|e| format!("Failed to commit tracks transaction: {}", e))?;

        Ok(saved_tracks)
    }

    pub fn get_all_tracks(&self) -> Result<Vec<DbTrack>, String> {
        let conn = self.get_connection()?;
        let mut stmt = conn
            .prepare(
                "SELECT
                    id, file_path, file_hash, title, artist, album, album_artist,
                    genre, year, track_number, duration, file_name, file_size,
                    format, artwork_path, date_added, liked, play_count, is_missing
                FROM tracks
                ORDER BY date_added ASC",
            )
            .map_err(|e| format!("Failed to prepare get_all_tracks query: {}", e))?;

        let track_iter = stmt
            .query_map([], |row| {
                let file_path: String = row.get(1)?;
                let file_hash: Option<String> = row.get(2)?;
                let title: Option<String> = row.get(3)?;
                let artist: Option<String> = row.get(4)?;
                let album: Option<String> = row.get(5)?;
                let album_artist: Option<String> = row.get(6)?;
                let genre: Option<String> = row.get(7)?;
                let year: Option<i64> = row.get(8)?;
                let track_number: Option<i64> = row.get(9)?;
                let duration: f64 = row.get(10)?;
                let file_name: String = row.get(11)?;
                let file_size: i64 = row.get(12)?;
                let format: String = row.get(13)?;
                let artwork_path: Option<String> = row.get(14)?;
                let date_added: i64 = row.get(15)?;
                let liked = row.get::<_, i64>(16)? == 1;
                let play_count: i64 = row.get(17)?;

                let path_obj = Path::new(&file_path);
                let is_missing = !path_obj.exists();

                #[cfg(debug_assertions)]
                {
                    println!(
                        "[Persistence Debug]\nTrack: {}\nStored file_path: {}\nFile Hash: {:?}\nPath exists: {}\nCanonical path: {:?}\nis_missing: {}\nArtwork path: {:?}",
                        title.as_deref().unwrap_or("Unknown"),
                        file_path,
                        file_hash,
                        !is_missing,
                        path_obj.canonicalize().ok(),
                        is_missing,
                        artwork_path
                    );
                }

                Ok(DbTrack {
                    id: row.get(0)?,
                    file_path,
                    file_hash,
                    title,
                    artist,
                    album,
                    album_artist,
                    genre,
                    year,
                    track_number,
                    duration,
                    file_name,
                    file_size,
                    format,
                    artwork_path,
                    date_added,
                    liked,
                    play_count,
                    is_missing,
                })
            })
            .map_err(|e| format!("Query map tracks error: {}", e))?;

        let mut tracks = Vec::new();
        for track_res in track_iter {
            tracks.push(track_res.map_err(|e| format!("Track row read error: {}", e))?);
        }

        Ok(tracks)
    }

    pub fn update_track_liked(&self, id: &str, liked: bool) -> Result<(), String> {
        let conn = self.get_connection()?;
        conn.execute(
            "UPDATE tracks SET liked = ?1 WHERE id = ?2",
            params![if liked { 1 } else { 0 }, id],
        )
        .map_err(|e| format!("Failed to update track liked status: {}", e))?;
        Ok(())
    }

    pub fn increment_play_count(&self, id: &str) -> Result<i64, String> {
        let conn = self.get_connection()?;
        conn.execute(
            "UPDATE tracks SET play_count = play_count + 1 WHERE id = ?1",
            params![id],
        )
        .map_err(|e| format!("Failed to increment play count: {}", e))?;

        let new_count: i64 = conn
            .query_row(
                "SELECT play_count FROM tracks WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .unwrap_or(1);

        Ok(new_count)
    }

    pub fn delete_track(&self, id: &str) -> Result<(), String> {
        let conn = self.get_connection()?;

        // 1. Check if track exists and get its artwork_path
        let artwork_path: Option<String> = conn
            .query_row(
                "SELECT artwork_path FROM tracks WHERE id = ?1",
                params![id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("Query track artwork error: {}", e))?
            .flatten();

        // 2. Remove references from playlist_tracks
        let _ = conn.execute("DELETE FROM playlist_tracks WHERE track_id = ?1", params![id]);

        // 3. Delete track record from SQLite
        conn.execute("DELETE FROM tracks WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete track {}: {}", id, e))?;

        // 4. Clean up cached artwork file ONLY if no other track references it
        if let Some(art_path) = artwork_path {
            let remaining_refs: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM tracks WHERE artwork_path = ?1",
                    params![art_path],
                    |row| row.get(0),
                )
                .unwrap_or(1);

            if remaining_refs == 0 {
                let p = Path::new(&art_path);
                if p.exists() {
                    let _ = fs::remove_file(p);
                }
            }
        }

        Ok(())
    }

    // ==========================================
    // PHASE 7: PLAYLIST CRUD OPERATIONS
    // ==========================================

    pub fn create_playlist(&self, name: &str) -> Result<DbPlaylist, String> {
        let conn = self.get_connection()?;
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;
        let id = format!("playlist_{}_{}", now, fastrand_u32());
        let trimmed_name = name.trim();

        conn.execute(
            "INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, trimmed_name, now, now],
        )
        .map_err(|e| format!("Failed to create playlist: {}", e))?;

        Ok(DbPlaylist {
            id,
            name: trimmed_name.to_string(),
            created_at: now,
            updated_at: now,
            track_count: 0,
            artwork_path: None,
        })
    }

    pub fn get_all_playlists(&self) -> Result<Vec<DbPlaylist>, String> {
        let conn = self.get_connection()?;
        let mut stmt = conn
            .prepare(
                "SELECT
                    p.id,
                    p.name,
                    p.created_at,
                    p.updated_at,
                    COUNT(pt.track_id) as track_count,
                    (
                        SELECT t.artwork_path
                        FROM playlist_tracks pt2
                        JOIN tracks t ON pt2.track_id = t.id
                        WHERE pt2.playlist_id = p.id AND t.artwork_path IS NOT NULL
                        ORDER BY pt2.position ASC
                        LIMIT 1
                    ) as artwork_path
                FROM playlists p
                LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
                GROUP BY p.id
                ORDER BY p.updated_at DESC;",
            )
            .map_err(|e| format!("Failed to prepare get_all_playlists query: {}", e))?;

        let iter = stmt
            .query_map([], |row| {
                Ok(DbPlaylist {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row.get(2)?,
                    updated_at: row.get(3)?,
                    track_count: row.get(4)?,
                    artwork_path: row.get(5)?,
                })
            })
            .map_err(|e| format!("Query map playlists error: {}", e))?;

        let mut playlists = Vec::new();
        for res in iter {
            playlists.push(res.map_err(|e| format!("Playlist row read error: {}", e))?);
        }

        Ok(playlists)
    }

    pub fn get_playlist_detail(&self, id: &str) -> Result<Option<DbPlaylistDetail>, String> {
        let conn = self.get_connection()?;

        let playlist_meta: Option<(String, String, i64, i64)> = conn
            .query_row(
                "SELECT id, name, created_at, updated_at FROM playlists WHERE id = ?1",
                params![id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
            )
            .optional()
            .map_err(|e| format!("Query playlist error: {}", e))?;

        let (p_id, p_name, p_created_at, p_updated_at) = match playlist_meta {
            Some(meta) => meta,
            None => return Ok(None),
        };

        let mut stmt = conn
            .prepare(
                "SELECT
                    t.id, t.file_path, t.file_hash, t.title, t.artist, t.album, t.album_artist,
                    t.genre, t.year, t.track_number, t.duration, t.file_name, t.file_size,
                    t.format, t.artwork_path, t.date_added, t.liked, t.play_count
                FROM playlist_tracks pt
                JOIN tracks t ON pt.track_id = t.id
                WHERE pt.playlist_id = ?1
                ORDER BY pt.position ASC",
            )
            .map_err(|e| format!("Failed to prepare playlist tracks query: {}", e))?;

        let track_iter = stmt
            .query_map(params![id], |row| {
                let file_path: String = row.get(1)?;
                let file_hash: Option<String> = row.get(2)?;
                let title: Option<String> = row.get(3)?;
                let artist: Option<String> = row.get(4)?;
                let album: Option<String> = row.get(5)?;
                let album_artist: Option<String> = row.get(6)?;
                let genre: Option<String> = row.get(7)?;
                let year: Option<i64> = row.get(8)?;
                let track_number: Option<i64> = row.get(9)?;
                let duration: f64 = row.get(10)?;
                let file_name: String = row.get(11)?;
                let file_size: i64 = row.get(12)?;
                let format: String = row.get(13)?;
                let artwork_path: Option<String> = row.get(14)?;
                let date_added: i64 = row.get(15)?;
                let liked = row.get::<_, i64>(16)? == 1;
                let play_count: i64 = row.get(17)?;

                let path_obj = Path::new(&file_path);
                let is_missing = !path_obj.exists();

                Ok(DbTrack {
                    id: row.get(0)?,
                    file_path,
                    file_hash,
                    title,
                    artist,
                    album,
                    album_artist,
                    genre,
                    year,
                    track_number,
                    duration,
                    file_name,
                    file_size,
                    format,
                    artwork_path,
                    date_added,
                    liked,
                    play_count,
                    is_missing,
                })
            })
            .map_err(|e| format!("Query map playlist tracks error: {}", e))?;

        let mut tracks = Vec::new();
        for track_res in track_iter {
            tracks.push(track_res.map_err(|e| format!("Track read error: {}", e))?);
        }

        Ok(Some(DbPlaylistDetail {
            id: p_id,
            name: p_name,
            created_at: p_created_at,
            updated_at: p_updated_at,
            tracks,
        }))
    }

    pub fn rename_playlist(&self, id: &str, new_name: &str) -> Result<(), String> {
        let conn = self.get_connection()?;
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;
        let trimmed = new_name.trim();
        if trimmed.is_empty() {
            return Err("Playlist name cannot be empty".to_string());
        }

        conn.execute(
            "UPDATE playlists SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![trimmed, now, id],
        )
        .map_err(|e| format!("Failed to rename playlist: {}", e))?;

        Ok(())
    }

    pub fn delete_playlist(&self, id: &str) -> Result<(), String> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        // 1. Delete playlist-track associations
        tx.execute(
            "DELETE FROM playlist_tracks WHERE playlist_id = ?1",
            params![id],
        )
        .map_err(|e| format!("Failed to delete playlist tracks: {}", e))?;

        // 2. Delete playlist record
        tx.execute("DELETE FROM playlists WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete playlist record: {}", e))?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn add_track_to_playlist(&self, playlist_id: &str, track_id: &str) -> Result<bool, String> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        // Check duplicate
        let exists: bool = tx
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM playlist_tracks WHERE playlist_id = ?1 AND track_id = ?2)",
                params![playlist_id, track_id],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if exists {
            return Ok(false); // Duplicate ignored
        }

        let next_pos: i64 = tx
            .query_row(
                "SELECT COALESCE(MAX(position), -1) + 1 FROM playlist_tracks WHERE playlist_id = ?1",
                params![playlist_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;

        tx.execute(
            "INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES (?1, ?2, ?3, ?4)",
            params![playlist_id, track_id, next_pos, now],
        )
        .map_err(|e| format!("Failed to insert playlist track: {}", e))?;

        tx.execute(
            "UPDATE playlists SET updated_at = ?1 WHERE id = ?2",
            params![now, playlist_id],
        )
        .map_err(|e| format!("Failed to update playlist timestamp: {}", e))?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(true)
    }

    pub fn remove_track_from_playlist(&self, playlist_id: &str, track_id: &str) -> Result<(), String> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "DELETE FROM playlist_tracks WHERE playlist_id = ?1 AND track_id = ?2",
            params![playlist_id, track_id],
        )
        .map_err(|e| format!("Failed to remove track from playlist: {}", e))?;

        // Re-index remaining track positions
        let remaining_ids: Vec<String> = {
            let mut stmt = tx
                .prepare("SELECT track_id FROM playlist_tracks WHERE playlist_id = ?1 ORDER BY position ASC")
                .map_err(|e| e.to_string())?;
            let mapped = stmt
                .query_map(params![playlist_id], |row| row.get(0))
                .map_err(|e| e.to_string())?;
            mapped.filter_map(|r| r.ok()).collect()
        };

        for (pos, tid) in remaining_ids.iter().enumerate() {
            tx.execute(
                "UPDATE playlist_tracks SET position = ?1 WHERE playlist_id = ?2 AND track_id = ?3",
                params![pos as i64, playlist_id, tid],
            )
            .map_err(|e| e.to_string())?;
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;

        tx.execute(
            "UPDATE playlists SET updated_at = ?1 WHERE id = ?2",
            params![now, playlist_id],
        )
        .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn reorder_playlist_tracks(&self, playlist_id: &str, track_ids: Vec<String>) -> Result<(), String> {
        let mut conn = self.get_connection()?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        for (pos, tid) in track_ids.iter().enumerate() {
            tx.execute(
                "UPDATE playlist_tracks SET position = ?1 WHERE playlist_id = ?2 AND track_id = ?3",
                params![pos as i64, playlist_id, tid],
            )
            .map_err(|e| format!("Failed to reorder track {}: {}", tid, e))?;
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as i64;

        tx.execute(
            "UPDATE playlists SET updated_at = ?1 WHERE id = ?2",
            params![now, playlist_id],
        )
        .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }
}

fn fastrand_u32() -> u32 {
    use std::time::SystemTime;
    let nanos = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos();
    nanos ^ (nanos >> 16)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_sqlite_persistence_and_moved_file_reconciliation() {
        let temp_dir = env::temp_dir().join(format!("aurora_test_db_{}", fastrand_u32()));
        let db = DatabaseManager::new(&temp_dir).expect("DatabaseManager init failed");

        // 1. Create a physical temp audio file
        let audio_dir = temp_dir.join("music");
        fs::create_dir_all(&audio_dir).unwrap();
        let original_file = audio_dir.join("Song.mp3");
        fs::write(&original_file, b"FAKE_MP3_AUDIO_CONTENT_HEADER_DATA_12345").unwrap();

        let original_path = original_file.to_string_lossy().to_string();
        let hash = compute_file_sha256(&original_file).unwrap();

        // 2. Insert original track
        let track_input = DbTrackInput {
            id: Some("track_original_1".to_string()),
            file_path: original_path.clone(),
            file_hash: Some(hash.clone()),
            title: Some("For A Reason".to_string()),
            artist: Some("Karan Aujla".to_string()),
            album: Some("P-Pop".to_string()),
            album_artist: None,
            genre: Some("Romantic".to_string()),
            year: Some(2024),
            track_number: Some(1),
            duration: 180.04,
            file_name: "Song.mp3".to_string(),
            file_size: 100,
            format: "mp3".to_string(),
            artwork_path: Some("C:\\AppData\\artwork\\test_hash.jpg".to_string()),
            date_added: Some(1700000000000),
        };

        let saved = db.save_tracks(vec![track_input]).expect("save_tracks failed");
        assert_eq!(saved.len(), 1);
        assert_eq!(saved[0].id, "track_original_1");

        // Set liked = true and play_count = 17
        db.update_track_liked("track_original_1", true).unwrap();
        for _ in 0..17 {
            db.increment_play_count("track_original_1").unwrap();
        }

        // 3. Move the physical file to a new folder
        let moved_dir = temp_dir.join("moved_music");
        fs::create_dir_all(&moved_dir).unwrap();
        let moved_file = moved_dir.join("Renamed_Song.mp3");
        fs::rename(&original_file, &moved_file).unwrap();

        let moved_path = moved_file.to_string_lossy().to_string();

        // 4. Verify original path is now missing
        let tracks_before = db.get_all_tracks().unwrap();
        assert_eq!(tracks_before.len(), 1);
        assert_eq!(tracks_before[0].is_missing, true);
        assert_eq!(tracks_before[0].liked, true);
        assert_eq!(tracks_before[0].play_count, 17);

        // 5. Re-import from the new moved path
        let moved_input = DbTrackInput {
            id: Some("new_temporary_id".to_string()),
            file_path: moved_path.clone(),
            file_hash: None,
            title: Some("For A Reason".to_string()),
            artist: Some("Karan Aujla".to_string()),
            album: Some("P-Pop".to_string()),
            album_artist: None,
            genre: Some("Romantic".to_string()),
            year: Some(2024),
            track_number: Some(1),
            duration: 180.04,
            file_name: "Renamed_Song.mp3".to_string(),
            file_size: 100,
            format: "mp3".to_string(),
            artwork_path: None,
            date_added: Some(1900000000000),
        };

        let reconciled = db.save_tracks(vec![moved_input]).expect("save moved track failed");
        assert_eq!(reconciled.len(), 1);

        // 6. Verify Reconciled Track
        assert_eq!(reconciled[0].id, "track_original_1");
        assert_eq!(reconciled[0].date_added, 1700000000000);
        assert_eq!(reconciled[0].liked, true);
        assert_eq!(reconciled[0].play_count, 17);
        assert_eq!(reconciled[0].file_path, moved_path);
        assert_eq!(reconciled[0].is_missing, false);
        assert_eq!(
            reconciled[0].artwork_path.as_deref(),
            Some("C:\\AppData\\artwork\\test_hash.jpg")
        );

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_remove_from_library_does_not_delete_original_audio_file() {
        let temp_dir = env::temp_dir().join(format!("aurora_test_delete_db_{}", fastrand_u32()));
        let db = DatabaseManager::new(&temp_dir).expect("DatabaseManager init failed");

        let audio_dir = temp_dir.join("music");
        fs::create_dir_all(&audio_dir).unwrap();
        let audio_file = audio_dir.join("KeepThisFile.mp3");
        fs::write(&audio_file, b"REAL_AUDIO_BINARY_BYTES").unwrap();

        let artwork_dir = temp_dir.join("artwork");
        fs::create_dir_all(&artwork_dir).unwrap();
        let artwork_file = artwork_dir.join("art1.jpg");
        fs::write(&artwork_file, b"JPEG_ARTWORK_BYTES").unwrap();

        let track_input = DbTrackInput {
            id: Some("track_to_delete".to_string()),
            file_path: audio_file.to_string_lossy().to_string(),
            file_hash: Some("hash123".to_string()),
            title: Some("Song To Remove".to_string()),
            artist: Some("Artist".to_string()),
            album: Some("Album".to_string()),
            album_artist: None,
            genre: None,
            year: None,
            track_number: None,
            duration: 120.0,
            file_name: "KeepThisFile.mp3".to_string(),
            file_size: 1000,
            format: "mp3".to_string(),
            artwork_path: Some(artwork_file.to_string_lossy().to_string()),
            date_added: Some(1000),
        };

        db.save_tracks(vec![track_input]).unwrap();
        assert_eq!(db.get_all_tracks().unwrap().len(), 1);

        db.delete_track("track_to_delete").expect("delete_track failed");

        let remaining = db.get_all_tracks().unwrap();
        assert_eq!(remaining.len(), 0);

        assert!(audio_file.exists(), "Original audio file must NOT be deleted!");
        assert!(!artwork_file.exists(), "Unreferenced artwork should be cleaned up");

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_playlist_lifecycle_crud_reorder_and_cascade() {
        let temp_dir = env::temp_dir().join(format!("aurora_test_playlist_db_{}", fastrand_u32()));
        let db = DatabaseManager::new(&temp_dir).expect("DatabaseManager init failed");

        // 1. Create tracks in library
        let t1 = DbTrackInput {
            id: Some("track_1".to_string()),
            file_path: "D:\\Music\\SongA.mp3".to_string(),
            file_hash: Some("hash_a".to_string()),
            title: Some("Song A".to_string()),
            artist: Some("Artist A".to_string()),
            album: Some("Album A".to_string()),
            album_artist: None,
            genre: None,
            year: None,
            track_number: Some(1),
            duration: 180.0,
            file_name: "SongA.mp3".to_string(),
            file_size: 5000,
            format: "mp3".to_string(),
            artwork_path: Some("C:\\Artwork\\art_a.jpg".to_string()),
            date_added: Some(1000),
        };
        let t2 = DbTrackInput {
            id: Some("track_2".to_string()),
            file_path: "D:\\Music\\SongB.mp3".to_string(),
            file_hash: Some("hash_b".to_string()),
            title: Some("Song B".to_string()),
            artist: Some("Artist B".to_string()),
            album: Some("Album B".to_string()),
            album_artist: None,
            genre: None,
            year: None,
            track_number: Some(2),
            duration: 210.0,
            file_name: "SongB.mp3".to_string(),
            file_size: 6000,
            format: "mp3".to_string(),
            artwork_path: None,
            date_added: Some(2000),
        };
        let t3 = DbTrackInput {
            id: Some("track_3".to_string()),
            file_path: "D:\\Music\\SongC.mp3".to_string(),
            file_hash: Some("hash_c".to_string()),
            title: Some("Song C".to_string()),
            artist: Some("Artist C".to_string()),
            album: Some("Album C".to_string()),
            album_artist: None,
            genre: None,
            year: None,
            track_number: Some(3),
            duration: 150.0,
            file_name: "SongC.mp3".to_string(),
            file_size: 4000,
            format: "mp3".to_string(),
            artwork_path: Some("C:\\Artwork\\art_c.jpg".to_string()),
            date_added: Some(3000),
        };
        db.save_tracks(vec![t1, t2, t3]).unwrap();

        // 2. Create Playlist
        let created = db.create_playlist("Test Playlist").expect("create_playlist failed");
        assert_eq!(created.name, "Test Playlist");
        assert_eq!(created.track_count, 0);

        // 3. Add tracks to playlist
        assert_eq!(db.add_track_to_playlist(&created.id, "track_1").unwrap(), true);
        assert_eq!(db.add_track_to_playlist(&created.id, "track_2").unwrap(), true);
        assert_eq!(db.add_track_to_playlist(&created.id, "track_3").unwrap(), true);

        // 4. Duplicate protection test: attempt to add track_1 again
        assert_eq!(db.add_track_to_playlist(&created.id, "track_1").unwrap(), false);

        // Verify playlist summary
        let all_playlists = db.get_all_playlists().unwrap();
        assert_eq!(all_playlists.len(), 1);
        assert_eq!(all_playlists[0].track_count, 3);
        assert_eq!(all_playlists[0].artwork_path.as_deref(), Some("C:\\Artwork\\art_a.jpg"));

        // Verify detail order (A, B, C)
        let detail = db.get_playlist_detail(&created.id).unwrap().unwrap();
        assert_eq!(detail.tracks.len(), 3);
        assert_eq!(detail.tracks[0].id, "track_1");
        assert_eq!(detail.tracks[1].id, "track_2");
        assert_eq!(detail.tracks[2].id, "track_3");

        // 5. Test Reordering: change to (C, A, B)
        db.reorder_playlist_tracks(&created.id, vec!["track_3".to_string(), "track_1".to_string(), "track_2".to_string()]).unwrap();
        let reordered_detail = db.get_playlist_detail(&created.id).unwrap().unwrap();
        assert_eq!(reordered_detail.tracks[0].id, "track_3");
        assert_eq!(reordered_detail.tracks[1].id, "track_1");
        assert_eq!(reordered_detail.tracks[2].id, "track_2");

        // Derived artwork should now be track_3's artwork ("C:\Artwork\art_c.jpg")
        let updated_playlists = db.get_all_playlists().unwrap();
        assert_eq!(updated_playlists[0].artwork_path.as_deref(), Some("C:\\Artwork\\art_c.jpg"));

        // 6. Test Remove Track from playlist
        db.remove_track_from_playlist(&created.id, "track_1").unwrap();
        let after_remove = db.get_playlist_detail(&created.id).unwrap().unwrap();
        assert_eq!(after_remove.tracks.len(), 2);
        assert_eq!(after_remove.tracks[0].id, "track_3");
        assert_eq!(after_remove.tracks[1].id, "track_2");
        // Verify track_1 is STILL in library
        assert_eq!(db.get_all_tracks().unwrap().len(), 3);

        // 7. Test Rename Playlist
        db.rename_playlist(&created.id, "Evening Chill").unwrap();
        let renamed = db.get_playlist_detail(&created.id).unwrap().unwrap();
        assert_eq!(renamed.name, "Evening Chill");

        // 8. Test Cascade / Clean Removal when Track is deleted from Library
        db.delete_track("track_3").unwrap();
        let after_library_del = db.get_playlist_detail(&created.id).unwrap().unwrap();
        assert_eq!(after_library_del.tracks.len(), 1);
        assert_eq!(after_library_del.tracks[0].id, "track_2");

        // 9. Test Delete Playlist
        db.delete_playlist(&created.id).unwrap();
        assert_eq!(db.get_all_playlists().unwrap().len(), 0);
        assert!(db.get_playlist_detail(&created.id).unwrap().is_none());
        // Tracks 1 and 2 still remain in library!
        assert_eq!(db.get_all_tracks().unwrap().len(), 2);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
