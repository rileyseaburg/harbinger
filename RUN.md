# 🚀 API Specs Generator - Complete Run Guide

## Prerequisites
- Node.js 18+ installed
- Rust toolchain installed
- Tauri CLI: `cargo install tauri-cli`

## Quick Start (3 Commands)

### 1. Install Frontend Dependencies
```bash
cd ui
npm install
```

### 2. Start Development Server
```bash
# From ui/ directory
npm run dev
```

### 3. Start Tauri App (in another terminal)
```bash
# From project root
cargo tauri dev
```

## What Each Step Does

### Frontend (React + Vite)
- Builds the Catalyst UI components
- Starts dev server on port 1420
- Hot reloads when files change

### Backend (Rust + Tauri)
- Compiles Rust code to native binary
- Loads Tauri configuration
- Connects frontend to native commands:
  - `validate_collection`
  - `run_collection` 
  - `generate_spec`
  - `save_file`

## Production Build

### One-Command Windows Build
```bash
# From project root - builds frontend + Windows app
npm run build-windows
```

### Build Process (What Happens)
✅ **First**: Builds React UI (`npm run build`)  
✅ **Then**: Packages with Tauri (`cargo tauri build`)  
✅ **Finally**: Creates Windows installer bundle  

### Individual Steps
```bash
# 1. Build frontend (required!)
cd ui
npm run build
# 2. Build Windows app (uses frontend from ui/dist/)
cd .. 
cargo tauri build --target x86_64-pc-windows-msvc
```

## File Structure
```
api-specs/
├── src/              # Pure Rust CLI implementation
├── src-tauri/       # Tauri backend (Rust)
├── ui/               # Tauri frontend (React)
└── target/           # Build outputs
```

## Usage Flow
1. Click "Browse" → Select Postman collection
2. Add variables via presets or custom
3. Click "Generate Spec" → Runs against live APIs
4. View results → Save YAML/HAR file

The app will open as a desktop application with the professional UI we built!