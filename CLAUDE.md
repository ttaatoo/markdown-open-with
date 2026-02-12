# Markdown Open With

VS Code extension that opens Markdown files with external applications from the editor.

> Tech stack: TypeScript, VS Code Extension API, Vite (bundler), Vitest (testing)

## Architecture

| Module | File | Purpose |
|--------|------|---------|
| Entry point | `src/extension.ts` | Registers commands and CodeLens provider |
| Validation | `src/validate.ts` | Shared file validation: remote warning, dirty-file handling, save check |
| Open With | `src/open-with.ts` | Main command: shows QuickPick, launches app |
| App Picker | `src/open-with-picker.ts` | Dropdown picker with "Add New Application" flow |
| CodeLens | `src/open-with-codelens.ts` | Inline CodeLens at line 0: primary app + dropdown arrow, auto-refreshes on config change |
| Config | `src/config.ts` | Reads/writes `markdownOpenWith.apps` from VS Code settings (application scope) |
| Launcher | `src/launcher.ts` | Spawns external process (detached, unref'd) with error handling |
| Placeholders | `src/placeholders.ts` | Replaces `{file}` in args with actual file path |
| Types | `src/types.ts` | `AppConfig` interface |

**Key patterns:**
- Commands registered via `vscode.commands.registerCommand`
- Config read from `vscode.workspace.getConfiguration("markdownOpenWith")`
- Process spawning uses `child_process.spawn` with array args (no shell interpolation)
- Extension activates only on `onLanguage:markdown`

## Quick Start

```bash
npm install              # Install dependencies
npm run compile          # Build with Vite → dist/extension.js
npm run watch            # Build in watch mode
npm run test:unit        # Run unit tests (Vitest)
npm run test:unit:watch  # Run unit tests in watch mode
npm run lint             # Type-check with tsc --noEmit
npm run package          # Package as .vsix (vsce)
```

Press **F5** in VS Code to launch the Extension Development Host.

## Common Tasks

| Task | Command |
|------|---------|
| Build | `npm run compile` |
| Unit tests | `npm run test:unit` |
| Integration tests | `npm run test:integration` (Extension Host) |
| Type check | `npm run lint` |
| Package for publish | `npm run package` |
| Debug extension | F5 in VS Code (uses `.vscode/launch.json`) |

## Testing

**Unit tests** (`src/test/unit/`) — run with Vitest, mock `vscode` module:
- `validate.test.ts` — shared validation: remote, untitled, dirty-file, save failure
- `open-with.test.ts` — main command: no apps, single app, multi-app QuickPick, cancellation
- `open-with-picker.test.ts` — picker: app selection, add-new flow, duplicates, overwrite
- `config.test.ts` — config reading, args validation, saveApps
- `launcher.test.ts` — process spawning, ENOENT/EACCES error handling
- `placeholders.test.ts` — `{file}` replacement, special characters
- `codelens.test.ts` — CodeLens provider, document filtering, app display

**Integration tests** (`src/test/integration/`) — run in VS Code Extension Host:
- `extension.test.ts` — extension presence, activation, command registration

**Mocking pattern:** Use `vi.hoisted()` + `vi.mock()` to mock `vscode` and `child_process` before imports.

## Configuration

Extension setting: `markdownOpenWith.apps` (array of `AppConfig`):

```jsonc
{
  "markdownOpenWith.apps": [
    {
      "name": "Typora",                    // Display name (required)
      "command": "/path/to/executable",     // Executable path (required)
      "args": ["{file}"]                    // Arguments, {file} = current file path (optional)
    }
  ]
}
```

## VS Code Commands

| Command ID | Title | Trigger |
|------------|-------|---------|
| `markdownOpenWith.open` | Open With | Title bar button, CodeLens primary |
| `markdownOpenWith.showPicker` | Show App Picker | CodeLens dropdown arrow |

## Security

- **Spawn with array args** — never shell-interpolated (`spawn(cmd, args)`, not `exec`)
- **Detached + unref** — child processes don't block VS Code
- **Input validation** — `getApps()` filters malformed config entries including non-string args
- **Application scope** — config uses `"scope": "application"` to prevent workspace-level injection
- **Remote warning** — warns when `vscode.env.remoteName` is set

## Common Pitfalls

1. **Vite bundles to CJS** — `vite.config.js` uses `formats: ["cjs"]`; `vscode` and `child_process` are externalized
2. **Tests mock `vscode`** — the `vscode` module doesn't exist at test time; every test file must `vi.mock("vscode", ...)`
3. **Integration tests need Extension Host** — use `.vscode/launch.json` "Extension Tests" config, not `vitest`
4. **`args` defaults to `["{file}"]`** — when user omits `args`, both `open-with.ts` and `open-with-picker.ts` apply this default
5. **`noUncheckedIndexedAccess` is enabled** — array indexing returns `T | undefined`; guard all `array[n]` access

## Project Structure

```
markdown-open-with/
├── src/
│   ├── extension.ts          # activate/deactivate
│   ├── validate.ts           # Shared file validation
│   ├── open-with.ts          # Main "Open With" command
│   ├── open-with-picker.ts   # Dropdown picker + add-app flow
│   ├── open-with-codelens.ts # CodeLens provider
│   ├── config.ts             # Read/write VS Code settings
│   ├── launcher.ts           # Process spawning
│   ├── placeholders.ts       # {file} replacement
│   ├── types.ts              # AppConfig interface
│   └── test/
│       ├── unit/             # Vitest unit tests
│       └── integration/      # Extension Host integration tests
├── dist/                     # Built output (gitignored content)
├── docs/                     # Feature docs, tutorials
├── package.json              # Extension manifest + scripts
├── vite.config.js            # Vite build config (CJS output)
├── vitest.config.ts          # Vitest config (unit tests only)
├── tsconfig.json             # TypeScript strict mode, ES2022
└── PRD.md                    # Product requirements document
```

## Documentation

- [README.md](README.md) — User-facing usage and configuration guide
- [PRD.md](PRD.md) — Product requirements and MVP scope
- [docs/](docs/) — Feature specs and VS Code extension tutorial
