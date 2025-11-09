use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use std::path::PathBuf;

mod collection;
mod runner;
mod openapi;

use collection::PostmanCollection;
use runner::CollectionRunner;
use openapi::OpenApiGenerator;

#[derive(Parser)]
#[command(name = "api-specs")]
#[command(about = "Run Postman collections and generate OpenAPI specs from live responses", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run a Postman collection and capture responses
    Run {
        /// Path to the Postman collection JSON file
        #[arg(short, long)]
        collection: PathBuf,

        /// Path to the Postman environment JSON file (optional)
        #[arg(short, long)]
        environment: Option<PathBuf>,

        /// Output HAR file path
        #[arg(short, long, default_value = "api-run.har")]
        output: PathBuf,
    },
    /// Generate OpenAPI spec from collection run
    Generate {
        /// Path to the Postman collection JSON file
        #[arg(short, long)]
        collection: PathBuf,

        /// Path to the Postman environment JSON file (optional)
        #[arg(short, long)]
        environment: Option<PathBuf>,

        /// Output OpenAPI spec file path
        #[arg(short, long, default_value = "openapi-spec.yaml")]
        output: PathBuf,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Run {
            collection,
            environment,
            output,
        } => {
            println!("Running collection: {}", collection.display());
            
            let collection_data = std::fs::read_to_string(&collection)
                .context("Failed to read collection file")?;
            let collection: PostmanCollection = serde_json::from_str(&collection_data)
                .context("Failed to parse collection JSON")?;

            let environment = if let Some(env_path) = environment {
                let env_data = std::fs::read_to_string(&env_path)
                    .context("Failed to read environment file")?;
                Some(serde_json::from_str(&env_data)
                    .context("Failed to parse environment JSON")?)
            } else {
                None
            };

            let runner = CollectionRunner::new(collection, environment);
            let har = runner.run().await?;

            let har_json = serde_json::to_string_pretty(&har)?;
            std::fs::write(&output, har_json)
                .context("Failed to write HAR file")?;

            println!("✓ HAR file saved to: {}", output.display());
        }
        Commands::Generate {
            collection,
            environment,
            output,
        } => {
            println!("Generating OpenAPI spec from: {}", collection.display());
            
            let collection_data = std::fs::read_to_string(&collection)
                .context("Failed to read collection file")?;
            let collection: PostmanCollection = serde_json::from_str(&collection_data)
                .context("Failed to parse collection JSON")?;

            let environment = if let Some(env_path) = environment {
                let env_data = std::fs::read_to_string(&env_path)
                    .context("Failed to read environment file")?;
                Some(serde_json::from_str(&env_data)
                    .context("Failed to parse environment JSON")?)
            } else {
                None
            };

            let runner = CollectionRunner::new(collection, environment);
            let har = runner.run().await?;

            let generator = OpenApiGenerator::new();
            let openapi_spec = generator.from_har(&har)?;

            let yaml = serde_yaml::to_string(&openapi_spec)?;
            std::fs::write(&output, yaml)
                .context("Failed to write OpenAPI spec file")?;

            println!("✓ OpenAPI spec saved to: {}", output.display());
        }
    }

    Ok(())
}
