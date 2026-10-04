fn main() {
    let _ = dotenvy::from_filename("../.env.local");
    let _ = dotenvy::from_filename(".env.local");
    let _ = dotenvy::from_filename("../.env");
    let _ = dotenvy::from_filename(".env");
    let _ = dotenvy::dotenv();

    println!("cargo:rerun-if-changed=../.env.local");
    println!("cargo:rerun-if-changed=.env.local");
    println!("cargo:rerun-if-changed=../.env");
    println!("cargo:rerun-if-changed=.env");

    let gateway = std::env::var("DELULU_GATEWAY_URL")
        .or_else(|_| std::env::var("CF_EDGE_GATEWAY"))
        .unwrap_or_default();
    println!("cargo:rustc-env=DELULU_GATEWAY_URL={}", gateway);

    let hmac_sec = std::env::var("DELULU_HMAC_SECRET").unwrap_or_default();
    println!("cargo:rustc-env=DELULU_HMAC_SECRET={}", hmac_sec);

    let tmdb_key = std::env::var("TMDB_API_KEY").unwrap_or_default();
    println!("cargo:rustc-env=TMDB_API_KEY={}", tmdb_key);

    tauri_build::build()
}

