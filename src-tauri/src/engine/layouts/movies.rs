// Movies browse layout.
//
// NOTE: The `MOVIE_MOODS` definitions are retained for reference/navigation.
// They mirror the mood-row themes that used to be executed client-side via
// genre-filtered TMDB discover calls. Since the precomputed-feed migration
// those rows live in the gateway's (delulu-cdn) precomputed payload, so the
// moods are passed through but no longer drive the fetch.

use crate::engine::layouts::movie_tv_browse::{build_movie_tv_feed, BrowseKind, MoodDef};
use crate::engine::models::BrowseFeed;

const MOVIE_MOODS: &[MoodDef] = &[
    MoodDef {
        id: "midnight-tension",
        label: "Midnight Tension",
        reason: "Pulse-heavy stories for late hours.",
        genre_ids: "53|80", // Thriller OR Crime
    },
    MoodDef {
        id: "soft-but-dangerous",
        label: "Soft but Dangerous",
        reason: "Quiet surfaces with hidden stakes.",
        genre_ids: "18|9648", // Drama OR Mystery
    },
    MoodDef {
        id: "lonely-nights",
        label: "Lonely Nights",
        reason: "Emotion-led films with atmospheric weight.",
        genre_ids: "10749|36", // Romance OR History
    },
    MoodDef {
        id: "psychological-descent",
        label: "Psychological Descent",
        reason: "Mind games, obsession, and collapse.",
        genre_ids: "27|9648", // Horror OR Mystery
    },
];

pub async fn get_movies_feed(page: u32, _mood: Option<String>) -> Result<BrowseFeed, String> {
    build_movie_tv_feed(BrowseKind::Movie, page, MOVIE_MOODS).await
}