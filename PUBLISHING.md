# Publishing Guide for Harbinger

This document outlines the steps to publish the `harbinger` crate to crates.io.

## Prerequisites

1. **Rust Account**: Sign up at [crates.io](https://crates.io) and log in
2. **API Token**: Get your API token from your crates.io account settings
3. **Cargo Login**: Authenticate with `cargo login <your-api-token>`

## Pre-Publishing Checklist

### ✅ Files Required for Publishing

- [x] `Cargo.toml` - Updated with proper metadata
- [x] `README.md` - Complete documentation
- [x] `CHANGELOG.md` - Version history
- [x] `LICENSE` - Apache 2.0 license
- [x] `src/` - Source code
- [x] Tests passing (`cargo check`)

### ✅ Cargo.toml Metadata

```toml
[package]
name = "harbinger"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <your.email@example.com>"]
description = "A Rust implementation that captures live API responses from Postman collections and automatically generates OpenAPI 3.0 specifications - 'The herald of your API's true nature'"
license = "Apache-2.0"
repository = "https://github.com/rileyseaburg/harbinger"
homepage = "https://github.com/rileyseaburg/harbinger"
keywords = ["api", "openapi", "postman", "specification", "generator", "harbinger"]
categories = ["command-line-utilities", "web-programming", "development-tools"]
readme = "README.md"
```

## Publishing Steps

### 1. Test Locally
```bash
# Run all tests
cargo test

# Check for warnings
cargo clippy

# Build release version
cargo build --release
```

### 2. Verify the Package
```bash
# Verify package contents
cargo package --dry-run

# Check package locally
cargo install --path .
```

### 3. Publish to crates.io
```bash
# Publish the crate
cargo publish

# Verify publication
# Visit https://crates.io/crates/harbinger
```

### 4. Update Installation Instructions
After publishing, users can install with:
```bash
cargo install harbinger
```

## Post-Publishing Tasks

1. **Create Git Tag**: Tag the release in Git
2. **Create GitHub Release**: Create a release with release notes
3. **Update Documentation**: Update any external documentation
4. **Announce**: Share the release on relevant channels

## Version Management

For future releases:
1. Update version in `Cargo.toml`
2. Add entries to `CHANGELOG.md`
3. Commit changes with proper version tag
4. Run `cargo publish` again

## Troubleshooting

### Common Issues

**Package too large**: 
- Ensure target/debug is not included
- Add `target/` to `.gitignore`

**Version conflict**:
- Check if version already exists on crates.io
- Update version number if needed

**Metadata errors**:
- Verify all required fields in `Cargo.toml`
- Check README.md exists and path is correct

### Success Verification

```bash
# Test installation from crates.io
cargo install harbinger
harbinger --help
```

## Security Notes

- Keep your API token secure
- Never commit tokens to version control
- Use environment variables for automation
- Regularly rotate tokens for CI/CD

## Continuous Integration

For automated publishing:

1. Set up GitHub Actions workflow
2. Use secrets for API tokens
3. Include build and test steps
4. Publish on version tags only

## Resources

- [crates.io Publishing Guide](https://doc.rust-lang.org/cargo/reference/publishing.html)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
