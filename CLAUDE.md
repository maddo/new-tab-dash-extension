# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development
- Extension modifications: Edit files, reload in chrome://extensions/
- Manual development approach (no formal build system)

## Code Style Guidelines
- **Formatting:** 2-space indentation, semicolons, single quotes for strings
- **Imports:** ES modules syntax, named exports preferred, external libraries first
- **Naming:** camelCase variables/functions, PascalCase components, UPPER_CASE constants
- **Error Handling:** try/catch for async ops, console.error for logging, graceful degradation
- **State Management:** Redux with slice pattern, localStorage for persistence
- **Project Structure:** Modular organization by feature (github.js, jira.js, etc.)
- **Component Pattern:** Initialization with async/await, separation of concerns (API/UI/state)

## Cache Management
- Use the caching system with time-based expiration (utils/cache.js)
- Check existing cache keys in cacheSlice.js

## UI Elements
- Follow existing styles in styles.css
- Use collapsible sections pattern for consistency