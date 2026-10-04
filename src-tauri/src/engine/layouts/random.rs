// Random Dome Gallery layout.
//
// NOTE: Up until the precomputed-feed migration, this module built the 3D
// gallery pool locally: it picked 3 pseudo-random movie pages and 3 TV pages
// (`simple_rand_pages`), fetched them concurrently alongside trending via
// `tmdb::fetch_discover_movies` / `fetch_discover_tv`, deduplicated by
// (media_type, id), shuffled with a local xorshift-style RNG, and capped the
// result at ~80 tiles.
//
// The gateway (delulu-cdn) now precomputes that shuffled, deduplicated pool on
// its daily cron and serves it as a single signed payload at `/v1/feed/random`.
// This file is kept as a thin pass-through purely to preserve the codebase
// structure / navigation and the public `lib.rs` command signature.

use crate::engine::feed_client;
use crate::engine::models::MediaCard;

pub async fn get_random_feed() -> Result<Vec<MediaCard>, String> {
    feed_client::random().await
}