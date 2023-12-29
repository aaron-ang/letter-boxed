use std::io::prelude::*;

use axum::{extract::Request, http::header, response::IntoResponse, routing::get, Router};
use flate2::write::GzEncoder;
use flate2::Compression;
use serde::Deserialize;
use serde_qs as qs;

#[derive(Debug, Deserialize)]
struct Params {
    input: Vec<String>,
    length: Option<usize>,
}

async fn hello_world(request: Request) -> impl IntoResponse {
    let query = request.uri().query().unwrap();
    let params: Params = qs::from_str(query).unwrap();

    let l = params.length.unwrap_or(0);
    if l > 0 {
    } else {
    }

    let mut e = GzEncoder::new(Vec::new(), Compression::default());
    let _ = e.write_all(b"foo");
    let compressed_bytes = e.finish();
    let headers = [(header::CONTENT_ENCODING, "gzip")];

    (headers, compressed_bytes.unwrap())
}

#[shuttle_runtime::main]
async fn main() -> shuttle_axum::ShuttleAxum {
    let router = Router::new().route("/", get(hello_world));

    Ok(router.into())
}
