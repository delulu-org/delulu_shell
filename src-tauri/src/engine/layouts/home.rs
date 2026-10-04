// Home layout.
//
// NOTE: Up until the precomputed-feed migration, this module built the entire
// Home feed locally by orchestrating several raw TMDB calls through the
// gateway — `fetch_trending_hero` (heroes + logos), `fetch_trending_all`,
// `fetch_popular_movies`, `fetch_popular_tv`, `fetch_top_rated_movies`, and a
// "What's Burning" selection (top 3 trending items with backdrops, logos
// fetched concurrently).
//
// That composition now happens server-side on the gateway (delulu-cdn): it
// precomputes the full Home payload on its daily cron and serves it as a
// single signed payload at `/v1/feed/home`. This file is kept as a thin
// pass-through purely to preserve the codebase structure / navigation and the
// public `lib.rs` command signature.

use crate::engine::feed_client;
use crate::engine::models::HomeFeed;

pub async fn get_home_feed() -> Result<HomeFeed, String> {
    feed_client::home().await
}