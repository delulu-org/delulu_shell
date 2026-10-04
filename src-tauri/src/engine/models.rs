use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaCard {
    pub id: u64,
    pub title: String,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub media_type: String,
    pub release_year: Option<String>,
    pub rating: Option<f64>,
    pub overview: Option<String>,
    pub genres: Vec<String>,
    pub logo_url: Option<String>,
    #[serde(default)]
    pub imdb_rating: Option<f64>,
}

impl MediaCard {
    pub fn from_tmdb(
        id: u64,
        title: String,
        poster_path: Option<String>,
        backdrop_path: Option<String>,
        media_type: String,
        release_year: Option<String>,
        rating: Option<f64>,
        overview: Option<String>,
        genres: Vec<String>,
        logo_url: Option<String>,
    ) -> Self {
        Self {
            id,
            title,
            poster_path,
            backdrop_path,
            media_type,
            release_year,
            rating,
            overview,
            genres,
            logo_url,
            imdb_rating: None,
        }
    }

    pub fn with_imdb_rating(mut self, imdb_rating: Option<f64>) -> Self {
        self.imdb_rating = imdb_rating;
        self
    }

    pub fn with_logo_url(mut self, logo_url: Option<String>) -> Self {
        self.logo_url = logo_url;
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeroItem {
    pub id: u64,
    pub title: String,
    pub overview: String,
    pub backdrop_path: Option<String>,
    pub poster_path: Option<String>,
    pub media_type: String,
    pub release_year: Option<String>,
    pub rating: Option<f64>,
    pub genres: Vec<String>,
    pub logo_url: Option<String>,
    #[serde(default)]
    pub imdb_rating: Option<f64>,
}

impl HeroItem {
    pub fn from_tmdb(
        id: u64,
        title: String,
        overview: String,
        backdrop_path: Option<String>,
        poster_path: Option<String>,
        media_type: String,
        release_year: Option<String>,
        rating: Option<f64>,
        genres: Vec<String>,
        logo_url: Option<String>,
    ) -> Self {
        Self {
            id,
            title,
            overview,
            backdrop_path,
            poster_path,
            media_type,
            release_year,
            rating,
            genres,
            logo_url,
            imdb_rating: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HeroMeta {
    pub logo_url: Option<String>,
    #[serde(default)]
    pub imdb_rating: Option<f64>,
    pub trailer_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionRow {
    pub id: String,
    pub title: String,
    pub reason: Option<String>,
    pub items: Vec<MediaCard>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HomeFeed {
    pub hero_items: Vec<HeroItem>,
    pub whats_burning: Vec<MediaCard>,
    pub trending: Vec<MediaCard>,
    pub mood_rows: Vec<SectionRow>,
    pub popular_movies: Vec<MediaCard>,
    pub popular_tv: Vec<MediaCard>,
    pub top_rated: Vec<MediaCard>,
    pub continue_watching: Vec<MediaCard>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowseFeed {
    pub featured_heroes: Vec<HeroItem>,
    pub items: Vec<MediaCard>,
    pub page: u32,
    pub total_pages: u32,
    pub mood_rows: Vec<SectionRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CastMember {
    pub id: u64,
    pub name: String,
    pub character: Option<String>,
    pub profile_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpisodeItem {
    pub id: u64,
    pub episode_number: u32,
    pub season_number: u32,
    pub name: String,
    pub overview: Option<String>,
    pub still_path: Option<String>,
    pub runtime: Option<u32>,
    pub air_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeasonItem {
    pub id: u64,
    pub season_number: u32,
    pub name: String,
    pub episode_count: u32,
    pub poster_path: Option<String>,
    pub episodes: Vec<EpisodeItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailsPayload {
    pub id: u64,
    pub title: String,
    pub media_type: String,
    pub overview: Option<String>,
    pub backdrop_path: Option<String>,
    pub poster_path: Option<String>,
    pub release_year: Option<String>,
    pub rating: Option<f64>,
    pub genres: Vec<String>,
    pub runtime: Option<u32>,
    pub cast: Vec<CastMember>,
    pub seasons: Option<Vec<SeasonItem>>,
    pub similar: Vec<MediaCard>,
    pub logo_url: Option<String>,
    pub tagline: Option<String>,
    #[serde(default)]
    pub imdb_rating: Option<f64>,
    #[serde(default)]
    pub imdb_id: Option<String>,
}

impl DetailsPayload {
    pub fn from_tmdb(
        id: u64,
        title: String,
        media_type: String,
        overview: Option<String>,
        backdrop_path: Option<String>,
        poster_path: Option<String>,
        release_year: Option<String>,
        rating: Option<f64>,
        genres: Vec<String>,
        runtime: Option<u32>,
        logo_url: Option<String>,
        tagline: Option<String>,
    ) -> Self {
        Self {
            id,
            title,
            media_type,
            overview,
            backdrop_path,
            poster_path,
            release_year,
            rating,
            genres,
            runtime,
            cast: vec![],
            seasons: None,
            similar: vec![],
            logo_url,
            tagline,
            imdb_rating: None,
            imdb_id: None,
        }
    }

    pub fn with_seasons(mut self, seasons: Option<Vec<SeasonItem>>) -> Self {
        self.seasons = seasons;
        self
    }

    pub fn with_cast(mut self, cast: Vec<CastMember>) -> Self {
        self.cast = cast;
        self
    }

    pub fn with_imdb_rating(mut self, imdb_rating: Option<f64>) -> Self {
        self.imdb_rating = imdb_rating;
        self
    }

    pub fn with_imdb_id(mut self, imdb_id: Option<String>) -> Self {
        self.imdb_id = imdb_id;
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum SearchResult {
    DirectTarget {
        target_type: String, // "magnet", "infohash", "stream_url", "local_file"
        uri: String,
    },
    Catalog {
        items: Vec<MediaCard>,
    },
}
