// Shared Movies / TV browse builder.
//
// NOTE: `MoodDef` and `BrowseKind` are retained here because the Movies and TV
// layout modules (`movies.rs`, `tv.rs`) still reference them and `lib.rs`
// depends on the browse signature. The `moods` array is passed through for
// parity but is no longer executed client-side.
//
// Up until the precomputed-feed migration, this module composed the browse
// page locally: page 1 fetched popular + discover + all curated mood rows in
// parallel (`fetch_*_by_genre`), built featured heroes from popular items with
// backdrops, deduplicated 6-card mood rows with backfill, and picked the
// discover grid; pages > 1 fetched only discover via `fetch_discover_movies` /
// `fetch_discover_tv`.
//
// That composition now happens server-side on the gateway (delulu-cdn), which
// serves paginated precomputed payloads at `/v1/feed/movies?page=N` and
// `/v1/feed/tv?page=N`. This file is kept as a thin pass-through purely to
// preserve the codebase structure / navigation.

use crate::engine::feed_client;
use crate::engine::models::BrowseFeed;

pub struct MoodDef {
    pub id: &'static str,
    pub label: &'static str,
    pub reason: &'static str,
    pub genre_ids: &'static str,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum BrowseKind {
    Movie,
    Tv,
}

impl BrowseKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            BrowseKind::Movie => "movie",
            BrowseKind::Tv => "tv",
        }
    }
}

pub async fn build_movie_tv_feed(
    kind: BrowseKind,
    page: u32,
    _moods: &'static [MoodDef],
) -> Result<BrowseFeed, String> {
    match kind {
        BrowseKind::Movie => feed_client::movies(page).await,
        BrowseKind::Tv => feed_client::tv(page).await,
    }
}