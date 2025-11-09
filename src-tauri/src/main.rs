#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;
use std::sync::Mutex;

mod collection;
mod runner;
mod openapi;

use collection::{PostmanCollection, Environment};
use runner::CollectionRunner;
use openapi::OpenApiGenerator;

#[derive(Default)]
struct AppState {
    collection_path: Mutex<Option<PathBuf>>,
    environment_path: Mutex<Option<PathBuf>>,
    last_output: Mutex<Option<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GenerateRequest {
    collection_path: String,
    environment_path: Option<String>,
    output_format: String, // "yaml" or "har"
}

#[derive(Debug, Serialize, Deserialize)]
struct GenerateResponse {
    success: bool,
    message: String,
    output_path: Option<String>,
    spec_content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct RequestLog {
    name: String,
    method: String,
    url: String,
    status: u16,
    status_text: String,
    duration_ms: f64,
}

#[tauri::command]
async fn generate_spec(request: GenerateRequest) -> Result<GenerateResponse, String> {
    let collection_path = PathBuf::from(&request.collection_path);
    
    // Read and parse collection
    let collection_data = std::fs::read_to_string(&collection_path)
        .map_err(|e| format!("Failed to read collection: {}", e))?;
    let collection: PostmanCollection = serde_json::from_str(&collection_data)
        .map_err(|e| format!("Failed to parse collection: {}", e))?;

    // Read and parse environment if provided
    let environment = if let Some(env_path) = request.environment_path {
        let env_data = std::fs::read_to_string(&env_path)
            .map_err(|e| format!("Failed to read environment: {}", e))?;
        Some(serde_json::from_str(&env_data)
            .map_err(|e| format!("Failed to parse environment: {}", e))?)
    } else {
        None
    };

    // Run collection
    let runner = CollectionRunner::new(collection, environment);
    let har = runner.run().await
        .map_err(|e| format!("Failed to run collection: {}", e))?;

    // Generate output based on format
    let (output_content, output_ext) = match request.output_format.as_str() {
        "har" => {
            let har_json = serde_json::to_string_pretty(&har)
                .map_err(|e| format!("Failed to serialize HAR: {}", e))?;
            (har_json, "har")
        }
        "yaml" | _ => {
            let generator = OpenApiGenerator::new();
            let openapi_spec = generator.from_har(&har)
                .map_err(|e| format!("Failed to generate OpenAPI spec: {}", e))?;
            let yaml = serde_yaml::to_string(&openapi_spec)
                .map_err(|e| format!("Failed to serialize YAML: {}", e))?;
            (yaml, "yaml")
        }
    };

    Ok(GenerateResponse {
        success: true,
        message: format!("Successfully generated {} file", output_ext),
        output_path: None,
        spec_content: Some(output_content),
    })
}

#[tauri::command]
async fn run_collection(request: GenerateRequest) -> Result<Vec<RequestLog>, String> {
    let collection_path = PathBuf::from(&request.collection_path);
    
    let collection_data = std::fs::read_to_string(&collection_path)
        .map_err(|e| format!("Failed to read collection: {}", e))?;
    let collection: PostmanCollection = serde_json::from_str(&collection_data)
        .map_err(|e| format!("Failed to parse collection: {}", e))?;

    let environment = if let Some(env_path) = request.environment_path {
        let env_data = std::fs::read_to_string(&env_path)
            .map_err(|e| format!("Failed to read environment: {}", e))?;
        Some(serde_json::from_str(&env_data)
            .map_err(|e| format!("Failed to parse environment: {}", e))?)
    } else {
        None
    };

    let runner = CollectionRunner::new(collection, environment);
    let har = runner.run().await
        .map_err(|e| format!("Failed to run collection: {}", e))?;

    // Convert HAR entries to RequestLog
    let logs: Vec<RequestLog> = har.log.entries.iter().map(|entry| {
        RequestLog {
            name: entry.request.url.clone(),
            method: entry.request.method.clone(),
            url: entry.request.url.clone(),
            status: entry.response.status,
            status_text: entry.response.status_text.clone(),
            duration_ms: entry.time,
        }
    }).collect();

    Ok(logs)
}

#[tauri::command]
async fn validate_collection(path: String) -> Result<bool, String> {
    let collection_data = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let _: PostmanCollection = serde_json::from_str(&collection_data)
        .map_err(|e| format!("Invalid collection format: {}", e))?;
    
    Ok(true)
}

#[tauri::command]
async fn save_file(content: String, default_filename: String) -> Result<String, String> {
    // This is a placeholder - the save functionality will be implemented in the frontend
    Ok(default_filename)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            generate_spec,
            run_collection,
            validate_collection,
            save_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
