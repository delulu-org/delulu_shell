use crate::engine::disk_cache;
use crate::engine::models::{DetailsPayload, EpisodeItem};
use crate::engine::{core_bridge, tmdb};

pub async fn get_details_feed(media_type: &str, id: u64) -> Result<DetailsPayload, String> {
    let key = format!("{}_{}", media_type, id);

    // 1. Check L1 RAM / L2 Disk cache (~0-2ms)
    if let Some(entry) = disk_cache::read_cache_disk("details", &key).await {
        if let Ok(cached_payload) = serde_json::from_str::<DetailsPayload>(&entry.body) {
            if entry.is_fresh() {
                return Ok(cached_payload);
            }

            // Stale-While-Revalidate: return instant cached data, re-fetch in background
            let mt = media_type.to_string();
            tauri::async_runtime::spawn(async move {
                let _ = fetch_and_cache_details(&mt, id).await;
            });

            return Ok(cached_payload);
        }
    }

    // 2. Cold miss: fetch fresh, persist to disk cache, and return
    fetch_and_cache_details(media_type, id).await
}

async fn fetch_and_cache_details(media_type: &str, id: u64) -> Result<DetailsPayload, String> {
    let mut payload = match media_type {
        "tv" => tmdb::fetch_tv_details(id).await?,
        _ => tmdb::fetch_movie_details(id).await?,
    };

    // Bridge hook: delulu_core provides IMDb rating
    if let Some(rating) = core_bridge::get_imdb_rating(id, media_type).await {
        payload.imdb_rating = Some(rating);
    }

    if let Ok(serialized) = serde_json::to_string(&payload) {
        let key = format!("{}_{}", media_type, id);
        disk_cache::write_cache_disk("details", &key, None, &serialized).await;
    }

    Ok(payload)
}

pub async fn get_tv_season_episodes(tv_id: u64, season_number: u32) -> Result<Vec<EpisodeItem>, String> {
    let key = format!("{}_s{}", tv_id, season_number);

    // 1. Check L1 RAM / L2 Disk cache
    if let Some(entry) = disk_cache::read_cache_disk("episodes", &key).await {
        if let Ok(episodes) = serde_json::from_str::<Vec<EpisodeItem>>(&entry.body) {
            if entry.is_fresh() {
                return Ok(episodes);
            }

            // SWR background refresh
            tauri::async_runtime::spawn(async move {
                let _ = fetch_and_cache_episodes(tv_id, season_number).await;
            });

            return Ok(episodes);
        }
    }

    fetch_and_cache_episodes(tv_id, season_number).await
}

async fn fetch_and_cache_episodes(tv_id: u64, season_number: u32) -> Result<Vec<EpisodeItem>, String> {
    let episodes = tmdb::fetch_season_episodes(tv_id, season_number).await?;
    if let Ok(serialized) = serde_json::to_string(&episodes) {
        let key = format!("{}_s{}", tv_id, season_number);
        disk_cache::write_cache_disk("episodes", &key, None, &serialized).await;
    }
    Ok(episodes)
}
