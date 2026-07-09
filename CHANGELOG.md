# Changelog

## 1.0.1 - (unreleased)

### Fixed

- Print installed JS Recon version after install step for easier debugging
- Ensure entrypoint exits non-zero when `js-recon run` itself fails

## 1.0.0 - 2026-07-09

### Added

- Initial release
- Run JS Recon against any URL (external or localhost)
- Support for starting a local app with `start-cmd` before scanning
- Configurable JS Recon version via `version` input (defaults to `latest`)
- Break on `.map` source map files detected in output (default: enabled)
- Break on vulnerabilities in `analyze.json` with configurable severity threshold (default: `high`)
- Outputs: `map-files-found`, `vulnerability-count`, `output-path`
