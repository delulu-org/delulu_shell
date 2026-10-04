use super::models::HeroMeta;
use super::tmdb;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImdbRatingContract {
    pub tmdb_id: u64,
    pub imdb_id: Option<String>,
    pub rating: Option<f64>,
    pub vote_count: Option<u64>,
}

/// Bridge hook for delulu_core to supply IMDb ratings.
/// When delulu_core is linked, this queries delulu_core for the rating.
pub async fn get_imdb_rating(_tmdb_id: u64, _media_type: &str) -> Option<f64> {
    // Delulu core bridge placeholder — returns None until delulu_core is wired
    None
}

pub async fn get_hero_meta(tmdb_id: u64, media_type: &str) -> Result<HeroMeta, String> {
    let logo_url = tmdb::fetch_logo(tmdb_id, media_type).await;
    let imdb_rating = get_imdb_rating(tmdb_id, media_type).await;
    Ok(HeroMeta {
        logo_url,
        imdb_rating,
        trailer_url: None,
    })
}

