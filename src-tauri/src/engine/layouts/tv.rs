// TV browse layout.
//
// NOTE: The `TV_MOODS` definitions are retained for reference/navigation.
// They mirror the mood-row themes that used to be executed client-side via
// genre-filtered TMDB discover calls. Since the precomputed-feed migration
// those rows live in the gateway's (delulu-cdn) precomputed payload, so the
// moods are passed through but no longer drive the fetch.

use crate::engine::layouts::movie_tv_browse::{build_movie_tv_feed, BrowseKind, MoodDef};
use crate::engine::models::BrowseFeed;

const TV_MOODS: &[MoodDef] = &[
    MoodDef {
        id: "slow-burn-worlds",
        label: "Slow Burn Worlds",
        reason: "Expansive stories that unfold with patience.",
        genre_ids: "18|10765", // Drama OR Sci-Fi & Fantasy
    },
    MoodDef {
        id: "midnight-obsession",
        label: "Midnight Obsession",
        reason: "Unstable minds, secrets, and sleepless binges.",
        genre_ids: "9648|80", // Mystery OR Crime
    },
    MoodDef {
        id: "quiet-calamity",
        label: "Quiet Calamity",
        reason: "Emotion-first narratives with a dangerous undertow.",
        genre_ids: "10749|18", // Romance OR Drama
    },
    MoodDef {
        id: "edge-of-reality",
        label: "Edge of Reality",
        reason: "Speculative worlds with psychological pressure.",
        genre_ids: "10765|10759", // Sci-Fi & Fantasy OR Action & Adventure
    },
];

pub async fn get_tv_feed(page: u32, _mood: Option<String>) -> Result<BrowseFeed, String> {
    build_movie_tv_feed(BrowseKind::Tv, page, TV_MOODS).await
}