# Harbinger Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-11-09

### Added
- Initial release of Harbinger - "The herald of your API's true nature"
- Support for running Postman collections
- Automatic OpenAPI 3.0 specification generation from live API responses
- HTTP Archive (HAR) file generation for debugging
- Variable substitution for collection and environment variables
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- JSON schema inference from API responses
- Command-line interface with two main commands:
  - `run`: Execute collections and save HAR files
  - `generate`: Execute collections and generate OpenAPI specifications
- Cross-platform support (Windows, macOS, Linux)

### Features
- 🦀 Pure Rust implementation for performance and safety
- 🔄 Live response capture for accurate specifications
- 📦 HAR export for debugging and analysis
- 🎯 OpenAPI 3.0 standard compliance
- 🔧 Postman variable support ({{variable}} syntax)
- 📝 Human-readable YAML output
- 🏗️ Tauri-based GUI for easy operation

### Technical Details
- Built with Rust 2021 edition
- Uses Tokio for async HTTP operations
- Implements OpenAPI 3.0 specification standard
- Supports JSON Schema inference and validation
- Efficient memory usage and fast execution

[Unreleased]: https://github.com/rileyseaburg/harbinger/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rileyseaburg/harbinger/releases/tag/v0.1.0
