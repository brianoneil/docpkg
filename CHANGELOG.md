# Changelog

## [1.2.3] - 2025-12-04

### Fixed
- **Correct Extraction**: `sync` and `install` now respect the glob patterns in `.docpkg-manifest.json`, fixing an issue where unwanted files (like `.js` files) were copied from `node_modules`.

## [1.2.2] - 2025-12-04

### Fixed
- Included `.docpkg-manifest.json` and `CHEATSHEET.md` in NPM package distribution.

## [1.2.0] - 2025-12-04

### Added
- **Auto-Initialization**: `docpkg add` now prompts to initialize if no config exists.
- **Auto-Indexing**: Commands now automatically regenerate the AI index.
- **Auto-Sync**: `docpkg install` automatically syncs from `node_modules`.
- **UI Polish**: Added spinners and better logging.

### Changed
- Improved README with real examples.
- Updated repository URL to `brianoneil/docpkg`.

## [1.1.0] - 2025-12-04

### Added
- `docpkg manifest`: Interactive command to generate `.docpkg-manifest.json`.

## [1.0.0] - 2025-12-04

### Added
- Initial release.
- Core commands: `init`, `add`, `remove`, `install`, `list`, `sync`.
- Maintenance commands: `clean`, `verify`, `info`, `update`.
- AI Features: `index`, `bundle`.
- Adapters: NPM, Git, HTTP, File.
