pub mod commands;
pub mod db;

use commands::*;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            init_database,
            save_tracks,
            get_all_tracks,
            save_artwork,
            read_artwork_data_url,
            update_track_liked,
            increment_play_count,
            check_file_exists,
            pick_audio_file,
            pick_audio_folder,
            read_file_bytes
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aurora");
}
