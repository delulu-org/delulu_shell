// Delulu Engine - Production-Grade Native Disk & Memory Cache
//
// Multi-Tier Cache Architecture:
//   L1: Thread-safe In-Memory cache (RwLock<HashMap>) -> ~0ms
//   L2: Asynchronous Non-blocking Disk Cache (tokio::fs) -> ~1-3ms
//   L3: Delulu Edge Gateway (Cloudflare CDN) -> ~20-50ms
//
// Key features:
// - Cross-platform dynamic OS cache directory resolution (Windows, macOS, Linux)
// - NO hardcoded paths, user directories, or drive letters
// - Atomic writes (temp file + atomic replace) to prevent corruption
// - SWR (Stale-While-Revalidate) support for instant cold boot
// - Safe sanitization and SHA-256 fingerprinting for filenames

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{LazyLock, RwLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

const L1_MEM_TTL: Duration = Duration::from_secs(300); // 5 minutes in-memory
const L1_MAX_ENTRIES: usize = 64;

// 12 hours freshness: since the CDN feeds are baked once daily at 03:00 UTC,
// any cache entry under 12 hours old is considered fresh for instantaneous cold boot.
const FEED_FRESHNESS_SECS: u64 = 12 * 3600;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskCacheEntry {
    pub feed_date: Option<String>,
    pub saved_at: u64,
    pub body: String,
}

impl DiskCacheEntry {
    pub fn is_fresh(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        now.saturating_sub(self.saved_at) < FEED_FRESHNESS_SECS
    }
}

#[derive(Clone)]
struct L1Entry {
    saved_at: Instant,
    feed_date: Option<String>,
    body: String,
}

static L1_CACHE: LazyLock<RwLock<HashMap<String, L1Entry>>> =
    LazyLock::new(|| RwLock::new(HashMap::new()));

static CONFIGURED_CACHE_ROOT: LazyLock<RwLock<Option<PathBuf>>> =
    LazyLock::new(|| RwLock::new(None));

/// Sets the platform-provided cache root (e.g. from Tauri runtime sandbox on Android/iOS/Desktop).
pub fn init_cache_root(path: PathBuf) {
    if let Ok(mut lock) = CONFIGURED_CACHE_ROOT.write() {
        *lock = Some(path);
    }
}

/// Dynamically resolves the OS-standard cache directory across all platforms:
/// Windows, macOS, Linux, Android, and iOS.
pub fn get_cache_root() -> PathBuf {
    // 1. Check if configured by Tauri runtime (sandbox safe on Android & iOS)
    if let Ok(lock) = CONFIGURED_CACHE_ROOT.read() {
        if let Some(ref path) = *lock {
            return path.clone();
        }
    }

    // 2. Explicit override via environment variable if configured
    if let Some(custom) = std::env::var_os("DELULU_CACHE_DIR") {
        return PathBuf::from(custom);
    }

    // 3. Android: App internal sandbox cache (/data/data/<package>/cache or TMPDIR)
    #[cfg(target_os = "android")]
    {
        if let Some(tmp) = std::env::var_os("TMPDIR") {
            return PathBuf::from(tmp).join("delulu").join("cache");
        }
        let android_fallback = PathBuf::from("/data/data/com.delulu.desktop/cache");
        if android_fallback.exists() {
            return android_fallback.join("delulu");
        }
    }

    // 4. iOS: Sandboxed Library/Caches inside the iOS App Container
    #[cfg(target_os = "ios")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            return PathBuf::from(home)
                .join("Library")
                .join("Caches")
                .join("delulu");
        }
    }

    // 5. Windows: %LOCALAPPDATA%\delulu\cache
    #[cfg(target_os = "windows")]
    {
        if let Some(local_app_data) = std::env::var_os("LOCALAPPDATA") {
            return PathBuf::from(local_app_data).join("delulu").join("cache");
        }
    }

    // 6. macOS: $HOME/Library/Caches/delulu
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = std::env::var_os("HOME") {
            return PathBuf::from(home)
                .join("Library")
                .join("Caches")
                .join("delulu");
        }
    }

    // 7. Linux / BSD: $XDG_CACHE_HOME/delulu or $HOME/.cache/delulu
    #[cfg(all(unix, not(any(target_os = "macos", target_os = "ios", target_os = "android"))))]
    {
        if let Some(xdg) = std::env::var_os("XDG_CACHE_HOME") {
            return PathBuf::from(xdg).join("delulu");
        }
        if let Some(home) = std::env::var_os("HOME") {
            return PathBuf::from(home).join(".cache").join("delulu");
        }
    }

    // 8. Safe Fallback: OS temp dir
    std::env::temp_dir().join("delulu").join("cache")
}

/// Directory dedicated to CDN feed payloads
pub fn get_feeds_cache_dir() -> PathBuf {
    get_cache_root().join("feeds")
}

/// Generates a safe, collision-free filename from a request path.
/// E.g. `/feed/home` -> `feed_home_8a3f91b2.json`
/// E.g. `/feed/movies?page=2` -> `feed_movies_page_2_4c2d89e1.json`
pub fn path_to_filename(path: &str) -> String {
    let clean = path.trim_start_matches('/');
    let safe_slug: String = clean
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '_' || c == '-' {
                c
            } else {
                '_'
            }
        })
        .collect();

    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    let hash_hex = hex::encode(&hasher.finalize()[..4]);

    let prefix: String = safe_slug.chars().take(28).collect();
    format!("{}_{}.json", prefix.trim_matches('_'), hash_hex)
}

/// L1 Memory Cache: Retrieve entry (feed_date, body) if fresh
pub fn get_memory_entry(path: &str) -> Option<(Option<String>, String)> {
    let cache = L1_CACHE.read().ok()?;
    let entry = cache.get(path)?;
    if entry.saved_at.elapsed() > L1_MEM_TTL {
        return None;
    }
    Some((entry.feed_date.clone(), entry.body.clone()))
}

/// L1 Memory Cache: Retrieve body if fresh (supports category-prefixed or raw keys)
pub fn get_memory(path: &str) -> Option<String> {
    if let Some((_, b)) = get_memory_entry(path) {
        return Some(b);
    }
    if !path.contains(':') {
        let prefixed = format!("feeds:{path}");
        if let Some((_, b)) = get_memory_entry(&prefixed) {
            return Some(b);
        }
    }
    None
}

/// L1 Memory Cache: Store
pub fn put_memory(path: &str, feed_date: Option<&str>, body: &str) {
    if let Ok(mut cache) = L1_CACHE.write() {
        if cache.len() >= L1_MAX_ENTRIES {
            cache.clear();
        }
        cache.insert(
            path.to_string(),
            L1Entry {
                saved_at: Instant::now(),
                feed_date: feed_date.map(String::from),
                body: body.to_string(),
            },
        );
    }
}

/// L2 Disk Cache: Read cached entry asynchronously by category and key
pub async fn read_cache_disk(category: &str, key: &str) -> Option<DiskCacheEntry> {
    let mem_key = format!("{category}:{key}");
    let now_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    // 1. L1 Memory Check
    if let Some((feed_date, body)) = get_memory_entry(&mem_key) {
        return Some(DiskCacheEntry {
            feed_date,
            saved_at: now_secs,
            body,
        });
    }

    // 2. L2 Disk Check
    let dir = get_cache_root().join(category);
    let file_path = dir.join(path_to_filename(key));

    let content = tokio::fs::read_to_string(&file_path).await.ok()?;
    let entry: DiskCacheEntry = serde_json::from_str(&content).ok()?;

    // Populate L1 memory for fast subsequent access
    put_memory(&mem_key, entry.feed_date.as_deref(), &entry.body);

    Some(entry)
}

/// L2 Disk Cache: Atomically write cached entry asynchronously by category and key
pub async fn write_cache_disk(category: &str, key: &str, feed_date: Option<&str>, body: &str) {
    let mem_key = format!("{category}:{key}");
    let dir = get_cache_root().join(category);

    if let Err(e) = tokio::fs::create_dir_all(&dir).await {
        eprintln!("[delulu:cache] Failed to create {category} cache dir: {e}");
        return;
    }

    let final_path = dir.join(path_to_filename(key));

    let now_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let entry = DiskCacheEntry {
        feed_date: feed_date.map(String::from),
        saved_at: now_secs,
        body: body.to_string(),
    };

    let serialized = match serde_json::to_string(&entry) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[delulu:cache] Serialization error for {category}/{key}: {e}");
            return;
        }
    };

    // Atomic write pattern: write to .tmp.<pid>.<time> then rename
    let tmp_filename = format!(
        "{}.tmp.{}.{}",
        path_to_filename(key),
        std::process::id(),
        now_secs
    );
    let tmp_path = dir.join(tmp_filename);

    if let Err(e) = tokio::fs::write(&tmp_path, serialized.as_bytes()).await {
        eprintln!("[delulu:cache] Failed to write temp {category} file: {e}");
        return;
    }

    // Atomic rename (with fallback replace for Windows filesystem locks)
    if let Err(_) = tokio::fs::rename(&tmp_path, &final_path).await {
        let _ = tokio::fs::remove_file(&final_path).await;
        if let Err(e) = tokio::fs::rename(&tmp_path, &final_path).await {
            eprintln!("[delulu:cache] Failed to commit atomic {category} file: {e}");
            let _ = tokio::fs::remove_file(&tmp_path).await;
            return;
        }
    }

    // Also update in-memory L1 cache
    put_memory(&mem_key, feed_date, body);
}

/// Convenience wrapper for feeds
pub async fn read_feed_disk(path: &str) -> Option<DiskCacheEntry> {
    read_cache_disk("feeds", path).await
}

/// Convenience wrapper for feeds
pub async fn write_feed_disk(path: &str, feed_date: Option<&str>, body: &str) {
    write_cache_disk("feeds", path, feed_date, body).await;
}

/// Housekeeping: prune old temporary files or stale entries older than 7 days
pub async fn prune_stale_cache() {
    let root = get_cache_root();
    for category in &["feeds", "details", "episodes"] {
        let dir = root.join(category);
        let mut entries = match tokio::fs::read_dir(&dir).await {
            Ok(e) => e,
            Err(_) => continue,
        };

        let max_age_secs = 7 * 86400;

        while let Ok(Some(entry)) = entries.next_entry().await {
            let path = entry.path();
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

            // Immediately clean up orphaned .tmp files
            if file_name.contains(".tmp.") {
                let _ = tokio::fs::remove_file(&path).await;
                continue;
            }

            // Clean up files older than 7 days
            if let Ok(metadata) = entry.metadata().await {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(dur) = SystemTime::now().duration_since(modified) {
                        if dur.as_secs() > max_age_secs {
                            let _ = tokio::fs::remove_file(&path).await;
                        }
                    }
                }
            }
        }
    }
}

/// Clears all L1 memory cache and deletes all cache files from disk
pub async fn clear_all_cache() -> Result<(), String> {
    if let Ok(mut cache) = L1_CACHE.write() {
        cache.clear();
    }
    let root = get_cache_root();
    for category in &["feeds", "details", "episodes"] {
        let dir = root.join(category);
        if tokio::fs::try_exists(&dir).await.unwrap_or(false) {
            let _ = tokio::fs::remove_dir_all(&dir).await;
            let _ = tokio::fs::create_dir_all(&dir).await;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_root_resolution() {
        let root = get_cache_root();
        assert!(!root.as_os_str().is_empty());
        let feeds = get_feeds_cache_dir();
        assert!(feeds.starts_with(&root));
    }

    #[test]
    fn test_custom_platform_cache_root() {
        let mobile_mock = PathBuf::from("/data/user/0/com.delulu.app/cache/custom");
        init_cache_root(mobile_mock.clone());
        assert_eq!(get_cache_root(), mobile_mock);
        // Reset after test so other tests resolve default OS path
        if let Ok(mut lock) = CONFIGURED_CACHE_ROOT.write() {
            *lock = None;
        }
    }

    #[test]
    fn test_path_to_filename() {
        let f1 = path_to_filename("/feed/home");
        assert!(f1.starts_with("feed_home_"));
        assert!(f1.ends_with(".json"));

        let f2 = path_to_filename("/feed/movies?page=2");
        assert!(f2.starts_with("feed_movies_page_2_"));
        assert!(f2.ends_with(".json"));

        // Filename should not contain forbidden chars on any OS: < > : " / \ | ? *
        let forbidden = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
        for c in forbidden {
            assert!(!f1.contains(c));
            assert!(!f2.contains(c));
        }
    }

    #[tokio::test]
    async fn test_write_and_read_disk_roundtrip() {
        let test_path = "/feed/unit_test_feed";
        let test_body = r#"{"test":true,"msg":"hello delulu"}"#;
        let test_date = "2026-10-02";

        write_feed_disk(test_path, Some(test_date), test_body).await;

        let read_back = read_feed_disk(test_path).await;
        assert!(read_back.is_some());
        let entry = read_back.unwrap();
        assert_eq!(entry.body, test_body);
        assert_eq!(entry.feed_date.as_deref(), Some(test_date));
        assert!(entry.is_fresh());

        // L1 memory should also be populated now
        let mem = get_memory(test_path);
        assert_eq!(mem.as_deref(), Some(test_body));

        // Cleanup test file
        let file_path = get_feeds_cache_dir().join(path_to_filename(test_path));
        let _ = tokio::fs::remove_file(&file_path).await;
    }
}
