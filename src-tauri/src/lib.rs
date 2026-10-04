pub mod engine;

use engine::models::{BrowseFeed, DetailsPayload, HeroMeta, HomeFeed, MediaCard, SearchResult};
use tauri::Manager;

#[tauri::command]
async fn get_home_feed() -> Result<HomeFeed, String> {
    engine::layouts::home::get_home_feed().await
}

#[tauri::command]
async fn get_movies_feed(page: u32, mood: Option<String>) -> Result<BrowseFeed, String> {
    engine::layouts::movies::get_movies_feed(page, mood).await
}

#[tauri::command]
async fn get_tv_feed(page: u32, mood: Option<String>) -> Result<BrowseFeed, String> {
    engine::layouts::tv::get_tv_feed(page, mood).await
}

#[tauri::command]
async fn get_details_feed(media_type: String, id: u64) -> Result<DetailsPayload, String> {
    engine::layouts::details::get_details_feed(&media_type, id).await
}

#[tauri::command]
async fn get_tv_season_episodes(tv_id: u64, season_number: u32) -> Result<Vec<engine::models::EpisodeItem>, String> {
    engine::layouts::details::get_tv_season_episodes(tv_id, season_number).await
}

#[tauri::command]
async fn get_random_feed() -> Result<Vec<MediaCard>, String> {
    engine::layouts::random::get_random_feed().await
}

#[tauri::command]
async fn get_hero_meta(tmdb_id: u64, media_type: String) -> Result<HeroMeta, String> {
    engine::core_bridge::get_hero_meta(tmdb_id, &media_type).await
}

#[tauri::command]
async fn search_catalog(query: String) -> Result<SearchResult, String> {
    engine::search::parse_and_search(&query).await
}

#[tauri::command]
async fn clear_disk_cache() -> Result<(), String> {
    engine::disk_cache::clear_all_cache().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::from_filename("../.env.local");
    let _ = dotenvy::from_filename(".env.local");
    let _ = dotenvy::from_filename("../.env");
    let _ = dotenvy::from_filename(".env");
    let _ = dotenvy::dotenv();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_home_feed,
            get_movies_feed,
            get_tv_feed,
            get_details_feed,
            get_tv_season_episodes,
            get_random_feed,
            get_hero_meta,
            search_catalog,
            clear_disk_cache,
        ])
        .setup(|app| {
            // Initialize platform-provided sandbox cache directory (official on Android, iOS, Desktop)
            if let Ok(cache_dir) = app.path().app_cache_dir() {
                engine::disk_cache::init_cache_root(cache_dir);
            }

            // Background maintenance: prune expired or orphaned cache files
            tauri::async_runtime::spawn(async {
                engine::disk_cache::prune_stale_cache().await;
            });

            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "windows")]
                {
                    let _ = window.set_shadow(true);
                }
                #[cfg(debug_assertions)]
                {
                    window.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
