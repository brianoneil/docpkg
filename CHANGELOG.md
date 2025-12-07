# Changelog

## [1.8.2] - 2025-12-04

### Maintenance
- **Structure**: Migrated internal documentation to `src-docs/` to follow best practices (separating source docs from installed dependencies).

## [1.8.1] - 2025-12-04

### Changed
- **Documentation**: Updated README and Consumer Cheatsheet with targeted enrichment examples.

## [1.8.0] - 2025-12-04

### Added
- **Targeted Enrichment**: `docpkg enrich [packages...]` allows enriching specific installed packages to control AI costs.
- **Interactive Selection**: Running `docpkg enrich` (in consumption mode) now launches an interactive checkbox menu to select which packages to enrich.

## [1.7.2] - 2025-12-04

### Security
- **Path Sanitization**: Hardened path handling in `GitAdapter` and `NpmAdapter` to prevent directory traversal attempts from malicious manifests.
- **Defensive Globbing**: `copyGlob` now verifies source directory existence before scanning.

## [1.7.1] - 2025-12-04

### Added
- **CI/CD Support**: Added `--yes` flag to `docpkg add` to skip initialization prompts in automated environments.

## [1.7.0] - 2025-12-04

### Added
- **CI/CD Support**: `docpkg prepare --yes` allows running the authoring workflow in automated environments, skipping prompts and accepting defaults.
- **Smart Manifest**: `docpkg manifest` now intelligently detects your source documentation folder (`src-docs`, `documentation`) and warns if you choose a path that conflicts with installed dependencies.

## [1.6.2] - 2025-12-04

### Changed
- **Documentation**: Added `package.json` configuration example for AI settings and clarified API key security best practices.

## [1.6.1] - 2025-12-04

### Changed
- **Documentation**: Updated README to promote `docpkg prepare` as the primary authoring workflow.

## [1.6.0] - 2025-12-04

### Added
- **`docpkg prepare`**: A unified command for authors to setup their repo (`manifest`), enrich docs (`enrich`), and validate `package.json` configuration in one go.
- **Author Documentation**: Added `CHEATSHEET_AUTHOR.md` and `CHEATSHEET_CONSUMER.md`.

## [1.5.0] - 2025-12-04

### Added
- **Authoring Workflow**: `docpkg enrich` now detects `.docpkg-manifest.json` and generates a portable `.docpkg-index.json` for distribution.
- **Smart Indexing**: `docpkg` now automatically uses pre-computed indices (`.docpkg-index.json`) found in installed packages, allowing consumers to benefit from AI enrichment without needing API keys.

## [1.4.1] - 2025-12-04

### Changed
- **Documentation**: Expanded README with detailed AI configuration guide, including Ollama support.

## [1.4.0] - 2025-12-04

### Added
- **AI Enrichment**: New `docpkg enrich` command uses OpenAI (or compatible APIs) to automatically summarize documents and extract semantic tags.
- **Configuration**: Support for `docpkg.json` AI settings (`ai.apiKey`, `ai.model`).

## [1.3.6] - 2025-12-04

### Maintenance
- Removed badges from README to troubleshoot NPM rendering issues.

## [1.3.5] - 2025-12-04

### Maintenance
- Republish to ensure README renders correctly on NPM.
- Cleaned up development artifacts.

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
