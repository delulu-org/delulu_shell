// Precomputed feed client with Multi-Tier Disk & Memory Cache (SWR).
//
// The gateway (delulu-cdn) builds the Home / Movies / TV / Random feeds
// server-side on a daily cron and serves each feed as a single signed payload.
//
// Multi-Tier Cache Hierarchy:
// 1. L1 Memory Cache: Sub-millisecond (~0ms) access in the same app session.
// 2. L2 Disk Cache: ~1-3ms access on cold app boot.
//    - If fresh (< 12 hours old), returns immediately (0 network calls on boot).
//    - If stale, returns cached payload immediately to UI and refreshes in background (SWR).
// 3. L3 Edge CDN: Direct fetch on cold first-run cache miss.

use crate::engine::disk_cache;
use crate::engine::models::{BrowseFeed, HomeFeed, MediaCard};
use crate::engine::tmdb;
use serde::de::DeserializeOwned;

async fn fetch_from_cdn_and_save(path: &str) -> Result<String, String> {
    let resp = tmdb::request(path)
        .send()
        .await
        .map_err(|e| format!("feed request failed for {path}: {e}"))?;

    let status = resp.status();
    let feed_date = resp
        .headers()
        .get("X-Delulu-Feed-Date")
        .and_then(|v| v.to_str().ok())
        .map(String::from);

    let body = resp
        .text()
        .await
        .map_err(|e| format!("feed read failed for {path}: {e}"))?;

    if !status.is_success() {
        let excerpt: String = body.chars().take(200).collect();
        return Err(format!("feed {path} -> HTTP {}: {}", status.as_u16(), excerpt));
    }

    disk_cache::write_feed_disk(path, feed_date.as_deref(), &body).await;
    Ok(body)
}

async fn get_feed<T: DeserializeOwned>(path: &str) -> Result<T, String> {
    // 1. Check L1 Memory Cache (RAM: 0ms)
    if let Some(body) = disk_cache::get_memory(path) {
        return serde_json::from_str(&body)
            .map_err(|e| format!("L1 cache parse failed for {path}: {e}"));
    }

    // 2. Check L2 Native Disk Cache (~1-3ms)
    if let Some(entry) = disk_cache::read_feed_disk(path).await {
        if entry.is_fresh() {
            return serde_json::from_str(&entry.body)
                .map_err(|e| format!("disk cache parse failed for {path}: {e}"));
        }

        // Stale-While-Revalidate (SWR):
        // Return existing cached content instantly for seamless UI render,
        // and fetch fresh data from CDN in the background.
        let path_owned = path.to_string();
        tauri::async_runtime::spawn(async move {
            let _ = fetch_from_cdn_and_save(&path_owned).await;
        });

        return serde_json::from_str(&entry.body)
            .map_err(|e| format!("disk cache parse failed for {path}: {e}"));
    }

    // 3. L3 CDN: Fetch over network on cache miss
    let body = fetch_from_cdn_and_save(path).await?;
    serde_json::from_str(&body).map_err(|e| format!("feed parse failed for {path}: {e}"))
}

/// Full precomputed Home feed (heroes, What's Burning, rows, etc.).
pub async fn home() -> Result<HomeFeed, String> {
    get_feed("/feed/home").await
}

/// Precomputed Browse grid for Movies (and TV via `tv`), paginated.
pub async fn movies(page: u32) -> Result<BrowseFeed, String> {
    get_feed(&format!("/feed/movies?page={}", page)).await
}

pub async fn tv(page: u32) -> Result<BrowseFeed, String> {
    get_feed(&format!("/feed/tv?page={}", page)).await
}

/// Precomputed shuffled card pool for the 3D Random Dome Gallery.
pub async fn random() -> Result<Vec<MediaCard>, String> {
    get_feed("/feed/random").await
}