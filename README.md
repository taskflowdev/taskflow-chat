# TaskflowChat

A modern, feature-rich chat application built with Angular 19, featuring an enterprise-level keyboard shortcut system.

## Features

- 💬 Real-time group messaging
- ⚡ Enterprise-level keyboard shortcuts
- 🎨 Modern, responsive UI
- 🔐 Secure authentication
- 📱 Mobile-friendly design

## Keyboard Shortcuts

The application includes a comprehensive keyboard shortcut system designed for power users. See [Keyboard Shortcuts Documentation](docs/KEYBOARD_SHORTCUTS.md) for details.

### Quick Reference

| Shortcut | Action |
|----------|--------|
| `Shift + ?` | Show all keyboard shortcuts |
| `Ctrl + K` | Search groups |
| `Ctrl + N` | Create new group |
| `Alt + ↑/↓` | Navigate between chats |
| `Escape` | Close dialog |

[View all shortcuts →](docs/KEYBOARD_SHORTCUTS.md)

## Development server

### Setup

1. Copy the environment file and configure your settings:
   ```bash
   cp .env.local.example .env.local
   ```
   
2. Edit `.env.local` with your API URL and encryption key (see [Runtime Configuration](RUNTIME_CONFIG.md) for details)

3. Start the development server:
   ```bash
   npm start
   ```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

For more details on configuration, see [Runtime Configuration Guide](RUNTIME_CONFIG.md).

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project, run:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. The build process automatically generates the runtime configuration from environment variables.

For production deployment, see [Vercel Deployment Guide](VERCEL_DEPLOYMENT.md).

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

To run only keyboard shortcut tests:

```bash
npm test -- --include='**/shortcut*.spec.ts' --watch=false
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Architecture

### Keyboard Shortcut System

The application uses a three-layer service architecture for keyboard shortcuts:

1. **KeyboardShortcutService** - Captures keyboard events
2. **ShortcutRegistryService** - Manages shortcut metadata
3. **ShortcutHandlerService** - Routes and executes actions

For detailed architecture and usage guide, see [Keyboard Shortcuts Documentation](docs/KEYBOARD_SHORTCUTS.md).

## Documentation

### Configuration & Deployment
- [Runtime Configuration Guide](RUNTIME_CONFIG.md) - Configure the app with environment variables
- [Vercel Deployment Guide](VERCEL_DEPLOYMENT.md) - Complete deployment guide with security best practices
- [Vercel Quick Start](VERCEL_QUICK_START.md) - Step-by-step checklist for quick deployment
- [Vercel Fix Summary](VERCEL_FIX_SUMMARY.md) - Technical details of routing and security improvements

### Features & Architecture
- [Keyboard Shortcuts Guide](docs/KEYBOARD_SHORTCUTS.md) - Complete guide to the keyboard shortcut system
- [Implementation Summary](docs/KEYBOARD_SHORTCUTS_SUMMARY.md) - Technical implementation details
- [Authentication System](docs/AUTHENTICATION.md) - Authentication system documentation

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
