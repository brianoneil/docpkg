# Changelog

## [1.3.4] - 2025-12-04

### Changed
- **Documentation**: Added comprehensive Command Reference to `README.md` with sample outputs.

## [1.3.3] - 2025-12-04

### Changed
- **Enhanced Info**: `docpkg info <name>` now displays a detailed file list and token breakdown for the package.

## [1.3.2] - 2025-12-04

### Changed
- **UI Polish**: `docpkg list` now displays installed packages in a cleaner, tree-like structure with detailed stats (files, tokens).

## [1.3.1] - 2025-12-04

### Fixed
- **Missing Index**: Fixed a bug where `docpkg add` and other commands were generating the index in memory but not saving it to disk, causing `docpkg list` to show no token counts.

## [1.3.0] - 2025-12-04

### Added
- **Token Counting**: Uses `js-tiktoken` (GPT-4 tokenizer) to calculate accurate token counts for all indexed documents.
- **Enhanced `list`**: Displays file count and total token count per package.
- **Enhanced `bundle`**: Displays total token count of the generated context bundle.

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
