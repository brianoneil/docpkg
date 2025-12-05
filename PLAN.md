# Implementation Plan - docpkg

## Phase 1: MVP (Core Functionality)

- [x] **1. Project Initialization**
    - [x] Initialize `package.json`
    - [x] Set up project structure (`cli/`, `core/`, `adapters/`, `utils/`)
    - [x] Install essential dependencies (`commander`, `chalk`, `ora`, `semver`, `fs-extra`, `yaml`)
    - [x] Create executable entry point (`bin/docpkg.js`)

- [x] **2. CLI Foundation**
    - [x] Implement entry point with `commander`
    - [x] Define command skeletons (`init`, `add`, `install`, `sync`, `list`, `remove`)
    - [x] Implement help text and version display

- [x] **3. Configuration Management**
    - [x] Implement `core/config.js`
    - [x] Support reading `docpkg.json`
    - [x] Support reading `package.json` "docs" field
    - [x] Implement config validation

- [x] **4. Core Infrastructure**
    - [x] Implement `core/logger.js` for consistent output
    - [x] Implement `utils/fs.js` for file system operations
    - [x] Implement `core/lockfile.js` for reading/writing `docpkg-lock.json`

- [x] **5. NPM Adapter**
    - [x] Create `adapters/base.js` interface
    - [x] Implement `adapters/npm.js`
        - [x] Parsing package specs
        - [x] resolving versions
        - [x] fetching/extracting (mock or real implementation)

- [x] **6. Command Implementation - Part 1**
    - [x] Implement `docpkg init`
    - [x] Implement `docpkg list` (basic version)
    - [x] Implement `docpkg remove`
    - [x] Implement `docpkg sync`

- [x] **7. Command Implementation - Part 2**
    - [x] Implement `docpkg add` (update config, resolve, update lockfile)
    - [x] Implement `docpkg install` (read config/lockfile, fetch, extract)

- [x] **8. Testing & Verification**
    - [x] Verify `init` creates config
    - [x] Verify `add` updates config and lockfile
    - [x] Verify `install` downloads and extracts (using a test package)

## Phase 2: Multi-Source Support

- [x] **9. Git Adapter**
    - [x] Implement `adapters/git.js`
    - [x] Register in `installer.js`
    - [x] Add unit tests

- [x] **10. HTTP/HTTPS Adapter**
    - [x] Implement `adapters/http.js`
    - [x] Register in `installer.js`
    - [x] Add unit tests

- [x] **11. File Adapter**
    - [x] Implement `adapters/file.js`
    - [x] Register in `installer.js`
    - [x] Add unit tests

- [x] **12. Extended Testing**
    - [x] Add functional tests for File, HTTP, and Git adapters (with mocks)

## Phase 3: AI Features

- [x] **13. Index Generation**
    - [x] Implement `core/indexer.js` (Metadata extraction, scanning)
    - [x] Implement `docpkg index` command
    - [x] Add unit tests

- [x] **14. Bundle Command**
    - [x] Implement `bundle` logic in `core/indexer.js` with filtering
    - [x] Implement `docpkg bundle` command
    - [x] Add unit tests

- [x] **15. Extended CLI Commands**
    - [x] Implement `docpkg clean`
    - [x] Implement `docpkg info`
    - [x] Implement `docpkg verify`
    - [x] Implement `docpkg update`
    - [x] Implement `docpkg manifest` (interactive generator)

- [x] **16. UX Improvements**
    - [x] Auto-initialization in `add`
    - [x] Auto-indexing and Auto-sync logic
    - [x] Spinner/Logger improvements

## Future Phases (Backlog)

- [ ] Plugin System

- [ ] `update`, `clean`, `info`, `verify` commands
- [ ] File Adapter
- [ ] `update`, `clean`, `info`, `verify` commands
- [ ] AI Index Generation
- [ ] Plugin System
