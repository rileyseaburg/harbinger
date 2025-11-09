# Harbinger

**"The herald of your API's true nature"**

A Rust implementation that captures live API responses from Postman collections and automatically generates OpenAPI 3.0 specifications.

This tool runs your Postman collections against your actual API, captures the real responses, and automatically generates an accurate OpenAPI 3.0 spec based on what your API is *actually* returning. Think of it as a herald announcing the true structure of your API to the world.

## Features

- 🦀 **Pure Rust** - Fast, safe, and efficient
- 🔄 **Live Response Capture** - Generates specs from actual API responses, not saved examples
- 📦 **HAR Export** - Saves HTTP Archive files for debugging and analysis
- 🎯 **OpenAPI 3.0** - Generates industry-standard OpenAPI specifications
- 🔧 **Variable Support** - Resolves Postman variables from collections and environments
- 📝 **YAML Output** - Human-readable OpenAPI spec files

## Installation

### From crates.io (Recommended)

```bash
cargo install harbinger
```

### From Source

```bash
cargo build --release
```

The binary will be available at `target/release/harbinger` (or `harbinger.exe` on Windows).

## Usage

### Generate OpenAPI Spec (One Command)

Run your collection and generate an OpenAPI spec in one step:

```powershell
.\target\release\harbinger.exe generate -c collection.json -e environment.json -o openapi-spec.yaml
```

### Just Run Collection (Save HAR)

Run your collection and save the HAR file for later processing:

```powershell
.\target\release\harbinger.exe run -c collection.json -e environment.json -o api-run.har
```

### Command Options

#### `generate` Command

Runs the collection and generates an OpenAPI spec.

- `-c, --collection <FILE>` - Path to Postman collection JSON file (required)
- `-e, --environment <FILE>` - Path to Postman environment JSON file (optional)
- `-o, --output <FILE>` - Output OpenAPI spec file path (default: `openapi-spec.yaml`)

#### `run` Command

Runs the collection and saves the HAR file.

- `-c, --collection <FILE>` - Path to Postman collection JSON file (required)
- `-e, --environment <FILE>` - Path to Postman environment JSON file (optional)
- `-o, --output <FILE>` - Output HAR file path (default: `api-run.har`)

## How It Works

1. **Parse Collection**: Reads your Postman collection and environment files
2. **Resolve Variables**: Replaces `{{variable}}` placeholders with actual values
3. **Execute Requests**: Runs each request in your collection against your live API
4. **Capture Responses**: Records all request/response data in HAR format
5. **Generate Schema**: Analyzes response bodies and infers JSON schemas
6. **Build OpenAPI**: Creates a complete OpenAPI 3.0 specification

## Example Workflow

1. Export your Postman collection as `collection.json`
2. Export your Postman environment as `environment.json`
3. Run the generator:
   ```powershell
   .\target\release\harbinger.exe generate -c collection.json -e environment.json
   ```
4. Your OpenAPI spec is saved to `openapi-spec.yaml`

## Exporting from Postman

### Export Collection

1. In Postman, click on your collection
2. Click the three dots (⋯) → **Export**
3. Choose **Collection v2.1**
4. Save as `collection.json`

### Export Environment

1. In Postman, click the environment dropdown (top right)
2. Click the eye icon (👁️)
3. Click **Export** next to your environment
4. Save as `environment.json`

## Features Supported

- ✅ GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS methods
- ✅ Request headers
- ✅ Request body (raw JSON)
- ✅ Variable substitution (`{{variable}}`)
- ✅ Collection variables
- ✅ Environment variables
- ✅ Nested folders
- ✅ JSON schema inference
- ✅ Multiple response status codes

## Why Rust?

This is a Rust rewrite inspired by the Newman CLI (Apache 2.0 licensed). Rust provides:

- **Performance**: Fast execution, low memory usage
- **Safety**: No runtime errors, memory-safe
- **Concurrency**: Async/await for efficient API calls
- **Portability**: Single binary, no dependencies

## License

This project is licensed under the Apache License 2.0, matching the original Newman CLI license.

## Differences from Newman

While Newman is a full-featured collection runner, this tool focuses specifically on:

1. Running collections to capture live responses
2. Generating OpenAPI specs from those responses

It's optimized for the spec generation workflow rather than being a general-purpose testing tool.
