use hmac::{Hmac, Mac};
use serde::Deserialize;
use sha2::Sha256;
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

const IMAGE_BASE: &str = "https://image.tmdb.org/t/p";

pub fn poster_url(path: &str, size: &str) -> String {
    format!("{}/{}{}", IMAGE_BASE, size, path)
}

pub fn backdrop_url(path: &str, size: &str) -> String {
    format!("{}/{}{}", IMAGE_BASE, size, path)
}

pub fn profile_url(path: &str, size: &str) -> String {
    if path.starts_with("http") {
        path.to_string()
    } else {
        format!("{}/{}{}", IMAGE_BASE, size, path)
    }
}

fn gateway_url() -> String {
    if let Ok(val) = env::var("DELULU_GATEWAY_URL").or_else(|_| env::var("CF_EDGE_GATEWAY")) {
        if !val.is_empty() {
            return val.trim_end_matches('/').to_string();
        }
    }
    obfstr::obfstr!(env!("DELULU_GATEWAY_URL"))
        .trim_end_matches('/')
        .to_string()
}

fn api_key() -> String {
    if let Ok(val) = env::var("TMDB_API_KEY") {
        if !val.is_empty() {
            return val;
        }
    }
    obfstr::obfstr!(env!("TMDB_API_KEY")).to_string()
}

fn hmac_secret() -> String {
    if let Ok(val) = env::var("DELULU_HMAC_SECRET") {
        if !val.is_empty() {
            return val;
        }
    }
    obfstr::obfstr!(env!("DELULU_HMAC_SECRET")).to_string()
}

fn compute_signature(pathname: &str, timestamp: i64) -> String {
    let secret = hmac_secret();
    let payload = format!("{}:{}", pathname, timestamp);
    let mut mac = match HmacSha256::new_from_slice(secret.as_bytes()) {
        Ok(m) => m,
        Err(_) => return String::new(),
    };
    mac.update(payload.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

fn tmdb_url(path: &str) -> String {
    format!("{}/v1{}", gateway_url(), path)
}

/// Signed GET request against the gateway.
/// `path` must start with a leading `/` and NOT include the `/v1` prefix
/// (e.g. `/feed/home`, `/movie/550`). Used by the dynamic TMDB proxy paths
/// and by `feed_client` for the precomputed feeds.
pub fn request(path: &str) -> reqwest::RequestBuilder {
    Client::new().get(&tmdb_url(path))
}

use std::sync::LazyLock;

static GLOBAL_HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .pool_idle_timeout(std::time::Duration::from_secs(120))
        .pool_max_idle_per_host(20)
        .tcp_keepalive(std::time::Duration::from_secs(60))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
});

struct Client;

impl Client {
    fn new() -> Self {
        Self
    }

    fn get(&self, url: &str) -> reqwest::RequestBuilder {
        let pathname = if let Some(idx) = url.find("/v1") {
            let after = &url[idx..];
            after.split('?').next().unwrap_or(after)
        } else {
            "/v1"
        };
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let sig = compute_signature(pathname, now);

        GLOBAL_HTTP_CLIENT
            .get(url)
            .header("X-Delulu-Timestamp", now.to_string())
            .header("X-Delulu-Signature", sig)
    }
}

use crate::engine::models::{CastMember, DetailsPayload, EpisodeItem, SeasonItem};

// ── API fetch functions ───────────────────────────────────────────────────────

// NOTE: Prior to the migration, this module exposed the raw feed fetch helpers
// (`fetch_trending_all`, `fetch_trending_hero`, `fetch_popular_*`,
// `fetch_top_rated_*`, `fetch_discover_*`, `fetch_*_by_genre`, ...) that the
// layout modules used to compose Home / Browse / Random feeds locally via
// several orchestrated TMDB calls.
//
// Those feeds are now precomputed server-side on the gateway (delulu-cdn) and
// consumed in a single request by `crate::engine::feed_client`. Only the
// fetch helpers that back details pages, seasons, logos, and cast remain here.

#[derive(Debug, Deserialize)]
pub struct TmdbLogoItemRaw {
    pub aspect_ratio: Option<f64>,
    pub file_path: Option<String>,
    pub height: Option<u32>,
    pub width: Option<u32>,
    pub iso_639_1: Option<String>,
    pub vote_average: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbImagesRaw {
    pub logos: Option<Vec<TmdbLogoItemRaw>>,
}

pub fn pick_best_logo(logos: Option<&[TmdbLogoItemRaw]>) -> Option<String> {
    let list = logos?;
    if list.is_empty() {
        return None;
    }
    let has_file = |l: &&TmdbLogoItemRaw| l.file_path.is_some();
    let raster = |l: &&TmdbLogoItemRaw| {
        l.file_path
            .as_deref()
            .is_some_and(|p| !p.to_ascii_lowercase().ends_with(".svg"))
    };
    let en = |l: &&TmdbLogoItemRaw| l.iso_639_1.as_deref() == Some("en");
    // Prefer a rasterized (English) logo. TMDB's .svg variants are black
    // vectors that vanish on dark hero/detail backdrops, so use them last.
    let chosen = list
        .iter()
        .find(|l| en(l) && raster(l))
        .or_else(|| list.iter().find(|l| en(l) && has_file(l)))
        .or_else(|| list.iter().find(|l| raster(l)))
        .or_else(|| list.iter().find(|l| has_file(l)))?;
    chosen.file_path.as_deref().map(|p| format!("{}/w500{}", IMAGE_BASE, p))
}

pub async fn fetch_logo(id: u64, media_type: &str) -> Option<String> {
    let client = Client::new();
    let key = api_key();
    let mt = if media_type == "tv" { "tv" } else { "movie" };
    let url = format!(
        "{}?api_key={}&include_image_language=en,null",
        tmdb_url(&format!("/{}/{}/images", mt, id)),
        key
    );
    let resp = client.get(&url).send().await.ok()?;
    let raw: TmdbImagesRaw = resp.json().await.ok()?;
    pick_best_logo(raw.logos.as_deref())
}

#[derive(Debug, Deserialize)]
pub struct TmdbGenre {
    pub id: u64,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct TmdbCastRaw {
    pub id: u64,
    pub name: Option<String>,
    pub character: Option<String>,
    pub profile_path: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbCreditsRaw {
    pub cast: Option<Vec<TmdbCastRaw>>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbMovieDetailsRaw {
    pub id: u64,
    pub title: Option<String>,
    pub overview: Option<String>,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub release_date: Option<String>,
    pub vote_average: Option<f64>,
    pub runtime: Option<u32>,
    pub genres: Option<Vec<TmdbGenre>>,
    pub images: Option<TmdbImagesRaw>,
    pub tagline: Option<String>,
    pub imdb_id: Option<String>,
    pub credits: Option<TmdbCreditsRaw>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbSeasonRaw {
    pub id: u64,
    pub season_number: u32,
    pub name: Option<String>,
    pub episode_count: Option<u32>,
    pub poster_path: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbTvDetailsRaw {
    pub id: u64,
    pub name: Option<String>,
    pub overview: Option<String>,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub first_air_date: Option<String>,
    pub vote_average: Option<f64>,
    pub episode_run_time: Option<Vec<u32>>,
    pub genres: Option<Vec<TmdbGenre>>,
    pub images: Option<TmdbImagesRaw>,
    pub tagline: Option<String>,
    pub seasons: Option<Vec<TmdbSeasonRaw>>,
    pub credits: Option<TmdbCreditsRaw>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbEpisodeRaw {
    pub id: u64,
    pub episode_number: u32,
    pub season_number: u32,
    pub name: Option<String>,
    pub overview: Option<String>,
    pub still_path: Option<String>,
    pub runtime: Option<u32>,
    pub air_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbSeasonDetailsRaw {
    pub id: u64,
    pub season_number: u32,
    pub name: Option<String>,
    pub episodes: Option<Vec<TmdbEpisodeRaw>>,
}

pub async fn fetch_season_episodes(tv_id: u64, season_number: u32) -> Result<Vec<EpisodeItem>, String> {
    let client = Client::new();
    let key = api_key();
    let url = format!(
        "{}?api_key={}&language=en-US",
        tmdb_url(&format!("/tv/{}/season/{}", tv_id, season_number)),
        key
    );
    let raw: TmdbSeasonDetailsRaw = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let episodes = raw.episodes.unwrap_or_default().into_iter().map(|ep| {
        EpisodeItem {
            id: ep.id,
            episode_number: ep.episode_number,
            season_number: ep.season_number,
            name: ep.name.unwrap_or_else(|| format!("Episode {}", ep.episode_number)),
            overview: ep.overview,
            still_path: ep.still_path.as_deref().map(|p| format!("{}/w300{}", IMAGE_BASE, p)),
            runtime: ep.runtime,
            air_date: ep.air_date,
        }
    }).collect();

    Ok(episodes)
}

pub async fn fetch_movie_details(id: u64) -> Result<DetailsPayload, String> {
    let client = Client::new();
    let key = api_key();
    let url = format!(
        "{}?api_key={}&language=en-US&append_to_response=images,credits&include_image_language=en,null",
        tmdb_url(&format!("/movie/{}", id)),
        key
    );
    let raw: TmdbMovieDetailsRaw = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let year = raw.release_date.as_deref()
        .and_then(|d| d.split('-').next())
        .map(str::to_string);
    let genres = raw.genres.unwrap_or_default().into_iter().map(|g| g.name).collect();
    let logo_url = pick_best_logo(raw.images.as_ref().and_then(|i| i.logos.as_deref()));

    let cast: Vec<CastMember> = raw.credits
        .and_then(|c| c.cast)
        .unwrap_or_default()
        .into_iter()
        .take(20)
        .filter_map(|c| {
            let name = c.name?;
            Some(CastMember {
                id: c.id,
                name,
                character: c.character,
                profile_path: c.profile_path.as_deref().map(|p| profile_url(p, "w185")),
            })
        })
        .collect();

    Ok(DetailsPayload::from_tmdb(
        raw.id,
        raw.title.unwrap_or_default(),
        "movie".to_string(),
        raw.overview,
        raw.backdrop_path.as_deref().map(|p| backdrop_url(p, "original")),
        raw.poster_path.as_deref().map(|p| poster_url(p, "w500")),
        year,
        raw.vote_average,
        genres,
        raw.runtime,
        logo_url,
        raw.tagline,
    ).with_imdb_id(raw.imdb_id).with_cast(cast))
}

pub async fn fetch_tv_details(id: u64) -> Result<DetailsPayload, String> {
    let client = Client::new();
    let key = api_key();
    let url = format!(
        "{}?api_key={}&language=en-US&append_to_response=images,credits&include_image_language=en,null",
        tmdb_url(&format!("/tv/{}", id)),
        key
    );
    let raw: TmdbTvDetailsRaw = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let year = raw.first_air_date.as_deref()
        .and_then(|d| d.split('-').next())
        .map(str::to_string);
    let genres = raw.genres.unwrap_or_default().into_iter().map(|g| g.name).collect();
    let runtime = raw.episode_run_time.and_then(|r| r.into_iter().next());
    let logo_url = pick_best_logo(raw.images.as_ref().and_then(|i| i.logos.as_deref()));

    let cast: Vec<CastMember> = raw.credits
        .and_then(|c| c.cast)
        .unwrap_or_default()
        .into_iter()
        .take(20)
        .filter_map(|c| {
            let name = c.name?;
            Some(CastMember {
                id: c.id,
                name,
                character: c.character,
                profile_path: c.profile_path.as_deref().map(|p| profile_url(p, "w185")),
            })
        })
        .collect();

    let seasons = raw.seasons.map(|list| {
        list.into_iter().map(|s| {
            SeasonItem {
                id: s.id,
                season_number: s.season_number,
                name: s.name.unwrap_or_else(|| format!("Season {}", s.season_number)),
                episode_count: s.episode_count.unwrap_or(0),
                poster_path: s.poster_path.as_deref().map(|p| poster_url(p, "w342")),
                episodes: vec![],
            }
        }).collect()
    });

    Ok(DetailsPayload::from_tmdb(
        raw.id,
        raw.name.unwrap_or_default(),
        "tv".to_string(),
        raw.overview,
        raw.backdrop_path.as_deref().map(|p| backdrop_url(p, "original")),
        raw.poster_path.as_deref().map(|p| poster_url(p, "w500")),
        year,
        raw.vote_average,
        genres,
        runtime,
        logo_url,
        raw.tagline,
    ).with_seasons(seasons).with_cast(cast))
}
