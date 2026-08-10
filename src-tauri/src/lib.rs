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
            read_file_bytes,
            delete_track,
            create_playlist,
            get_all_playlists,
            get_playlist_detail,
            rename_playlist,
            delete_playlist,
            add_track_to_playlist,
            remove_track_from_playlist,
            reorder_playlist_tracks,
            pick_ambient_video,
            create_custom_mood,
            get_all_custom_moods,
            rename_custom_mood,
            update_custom_mood_video,
            delete_custom_mood,
            get_app_settings,
            update_app_settings,
            reset_app_settings,
            get_storage_stats,
            pick_music_folder,
            get_playback_state,
            save_playback_state,
            toggle_fullscreen,
            set_fullscreen,
            is_fullscreen
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aurora");
}
