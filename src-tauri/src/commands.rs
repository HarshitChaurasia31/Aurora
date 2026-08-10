use crate::db::{
    DatabaseManager, DbAppSettings, DbCustomMood, DbPlaybackState, DbPlaylist, DbPlaylistDetail, DbStorageStats,
    DbTrack, DbTrackInput,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectedAudioFile {
    pub path: String,
    pub name: String,
    pub size: u64,
}

fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))
}

#[tauri::command]
pub fn pick_audio_file() -> Result<Option<SelectedAudioFile>, String> {
    let file = rfd::FileDialog::new()
        .add_filter(
            "Audio Files",
            &["mp3", "wav", "flac", "m4a", "aac", "ogg", "opus"],
        )
        .pick_file();

    match file {
        Some(path_buf) => {
            let metadata = fs::metadata(&path_buf).map_err(|e| e.to_string())?;
            let name = path_buf
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            let path_str = path_buf.to_string_lossy().to_string();

            Ok(Some(SelectedAudioFile {
                path: path_str,
                name,
                size: metadata.len(),
            }))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn pick_audio_folder() -> Result<Vec<SelectedAudioFile>, String> {
    let folder = rfd::FileDialog::new().pick_folder();

    match folder {
        Some(path_buf) => {
            let mut results = Vec::new();
            scan_directory(&path_buf, &mut results)?;
            Ok(results)
        }
        None => Ok(Vec::new()),
    }
}

fn scan_directory(dir: &Path, results: &mut Vec<SelectedAudioFile>) -> Result<(), String> {
    if !dir.is_dir() {
        return Ok(());
    }

    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let _ = scan_directory(&path, results);
        } else if is_supported_audio(&path) {
            if let Ok(metadata) = fs::metadata(&path) {
                let name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();
                results.push(SelectedAudioFile {
                    path: path.to_string_lossy().to_string(),
                    name,
                    size: metadata.len(),
                });
            }
        }
    }
    Ok(())
}

fn is_supported_audio(path: &Path) -> bool {
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        matches!(
            ext.to_lowercase().as_str(),
            "mp3" | "wav" | "flac" | "m4a" | "aac" | "ogg" | "opus"
        )
    } else {
        false
    }
}

#[tauri::command]
pub fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

#[tauri::command]
pub fn init_database(app: AppHandle) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let _db = DatabaseManager::new(&app_data)?;
    Ok(())
}

#[tauri::command]
pub fn save_tracks(
    app: AppHandle,
    tracks: Option<Vec<DbTrackInput>>,
    inputs: Option<Vec<DbTrackInput>>,
) -> Result<Vec<DbTrack>, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    let track_inputs = tracks.or(inputs).unwrap_or_default();
    db.save_tracks(track_inputs)
}

#[tauri::command]
pub fn get_all_tracks(app: AppHandle) -> Result<Vec<DbTrack>, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.get_all_tracks()
}

#[tauri::command]
pub fn save_artwork(
    app: AppHandle,
    hash: Option<String>,
    bytes: Vec<u8>,
    ext: Option<String>,
    format: Option<String>,
) -> Result<String, String> {
    let app_data = get_app_data_dir(&app)?;
    let artwork_dir = app_data.join("artwork");
    if !artwork_dir.exists() {
        fs::create_dir_all(&artwork_dir)
            .map_err(|e| format!("Failed to create artwork cache directory: {}", e))?;
    }

    let extension = ext.or(format).unwrap_or_else(|| "jpg".to_string());
    let file_hash = hash.unwrap_or_else(|| {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(&bytes);
        format!("{:x}", hasher.finalize())
    });

    let file_name = format!("{}.{}", file_hash, extension);
    let target_path = artwork_dir.join(file_name);

    if !target_path.exists() {
        fs::write(&target_path, bytes)
            .map_err(|e| format!("Failed to write cached artwork file: {}", e))?;
    }

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn read_artwork_data_url(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Artwork file not found".to_string());
    }

    let bytes = fs::read(p).map_err(|e| format!("Failed to read artwork file: {}", e))?;
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpeg")
        .to_lowercase();
    let mime = match ext.as_str() {
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => "image/jpeg",
    };

    let base64_str = simple_base64_encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, base64_str))
}

#[tauri::command]
pub fn update_track_liked(app: AppHandle, id: String, liked: bool) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.update_track_liked(&id, liked)
}

#[tauri::command]
pub fn increment_play_count(app: AppHandle, id: String) -> Result<i64, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.increment_play_count(&id)
}

#[tauri::command]
pub fn check_file_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
pub fn delete_track(app: AppHandle, id: String) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.delete_track(&id)
}

#[tauri::command]
pub fn create_playlist(app: AppHandle, name: String) -> Result<DbPlaylist, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.create_playlist(&name)
}

#[tauri::command]
pub fn get_all_playlists(app: AppHandle) -> Result<Vec<DbPlaylist>, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.get_all_playlists()
}

#[tauri::command]
pub fn get_playlist_detail(app: AppHandle, id: String) -> Result<Option<DbPlaylistDetail>, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.get_playlist_detail(&id)
}

#[tauri::command]
pub fn rename_playlist(app: AppHandle, id: String, name: String) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.rename_playlist(&id, &name)
}

#[tauri::command]
pub fn delete_playlist(app: AppHandle, id: String) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.delete_playlist(&id)
}

#[tauri::command]
pub fn add_track_to_playlist(app: AppHandle, playlist_id: String, track_id: String) -> Result<bool, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.add_track_to_playlist(&playlist_id, &track_id)
}

#[tauri::command]
pub fn remove_track_from_playlist(app: AppHandle, playlist_id: String, track_id: String) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.remove_track_from_playlist(&playlist_id, &track_id)
}

#[tauri::command]
pub fn reorder_playlist_tracks(app: AppHandle, playlist_id: String, track_ids: Vec<String>) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.reorder_playlist_tracks(&playlist_id, track_ids)
}

#[tauri::command]
pub fn pick_ambient_video() -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .add_filter("Video Files", &["mp4", "webm", "mov"])
        .pick_file();

    match file {
        Some(path_buf) => Ok(Some(path_buf.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn create_custom_mood(app: AppHandle, name: String, video_path: String) -> Result<DbCustomMood, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.create_custom_mood(&name, &video_path)
}

#[tauri::command]
pub fn get_all_custom_moods(app: AppHandle) -> Result<Vec<DbCustomMood>, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.get_all_custom_moods()
}

#[tauri::command]
pub fn rename_custom_mood(app: AppHandle, id: String, name: String) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.rename_custom_mood(&id, &name)
}

#[tauri::command]
pub fn update_custom_mood_video(app: AppHandle, id: String, video_path: String) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.update_custom_mood_video(&id, &video_path)
}

#[tauri::command]
pub fn delete_custom_mood(app: AppHandle, id: String) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.delete_custom_mood(&id)
}

#[tauri::command]
pub fn get_app_settings(app: AppHandle) -> Result<DbAppSettings, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.get_app_settings()
}

#[tauri::command]
pub fn update_app_settings(app: AppHandle, settings: DbAppSettings) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.update_app_settings(settings)
}

#[tauri::command]
pub fn reset_app_settings(app: AppHandle) -> Result<DbAppSettings, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.reset_app_settings()
}

#[tauri::command]
pub fn get_storage_stats(app: AppHandle) -> Result<DbStorageStats, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.get_storage_stats(&app_data)
}

#[tauri::command]
pub fn pick_music_folder() -> Result<Option<String>, String> {
    let folder = rfd::FileDialog::new().pick_folder();
    match folder {
        Some(path_buf) => Ok(Some(path_buf.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn get_playback_state(app: AppHandle) -> Result<DbPlaybackState, String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.get_playback_state()
}

#[tauri::command]
pub fn save_playback_state(app: AppHandle, state: DbPlaybackState) -> Result<(), String> {
    let app_data = get_app_data_dir(&app)?;
    let db = DatabaseManager::new(&app_data)?;
    db.save_playback_state(state)
}

#[tauri::command]
pub fn toggle_fullscreen(window: tauri::Window) -> Result<bool, String> {
    let is_fs = window.is_fullscreen().map_err(|e| e.to_string())?;
    let target = !is_fs;
    window.set_fullscreen(target).map_err(|e| e.to_string())?;
    Ok(target)
}

#[tauri::command]
pub fn set_fullscreen(window: tauri::Window, fullscreen: bool) -> Result<bool, String> {
    window.set_fullscreen(fullscreen).map_err(|e| e.to_string())?;
    Ok(fullscreen)
}

#[tauri::command]
pub fn is_fullscreen(window: tauri::Window) -> Result<bool, String> {
    window.is_fullscreen().map_err(|e| e.to_string())
}

fn simple_base64_encode(data: &[u8]) -> String {
    const CHARSET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);

    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        let n = ((b0 as u32) << 16) | ((b1 as u32) << 8) | (b2 as u32);

        result.push(CHARSET[((n >> 18) & 63) as usize] as char);
        result.push(CHARSET[((n >> 12) & 63) as usize] as char);

        if chunk.len() > 1 {
            result.push(CHARSET[((n >> 6) & 63) as usize] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(CHARSET[(n & 63) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}
