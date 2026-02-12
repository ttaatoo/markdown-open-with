# Markdown Open With

Open your Markdown files with external applications directly from the editor title bar.

## Installation

### 从 VSIX 安装（本地构建）

1. 克隆仓库并构建扩展包：
   ```bash
   git clone <repo-url>
   cd markdown-open-with
   npm install
   npm run compile
   npm run package
   ```
2. 在 VS Code / Cursor 中：**扩展** → 右上角 **⋯** → **从 VSIX 安装…** → 选择生成的 `markdown-open-with-0.1.0.vsix`。

或命令行安装：
```bash
code --install-extension markdown-open-with-0.1.0.vsix
```

### 从市场安装（若已发布）

在扩展面板搜索 **Markdown Open With** 并安装，或：
```bash
code --install-extension ttaatoo.markdown-open-with
```

## Features

- Adds an **Open With** button to the editor title bar for Markdown files
- Configure multiple external applications (Typora, Obsidian, MarkText, custom scripts)
- QuickPick menu for selecting the target application
- Cross-platform support (macOS, Windows, Linux)

## Usage

1. Open any `.md` file in VS Code
2. Click the **Open With** button (external link icon) in the editor title bar
3. Select an application from the QuickPick menu

If only one application is configured, it opens directly without showing the menu.

## Configuration

Add applications to your `settings.json`:

```json
{
  "markdownOpenWith.apps": [
    {
      "name": "Typora",
      "command": "/Applications/Typora.app/Contents/MacOS/Typora",
      "args": ["{file}"]
    }
  ]
}
```

### Configuration fields

| Field     | Type       | Required | Description                                |
|-----------|------------|----------|--------------------------------------------|
| `name`    | `string`   | Yes      | Display name shown in the QuickPick menu   |
| `command` | `string`   | Yes      | Executable path or command name            |
| `args`    | `string[]` | No       | Arguments passed to the command            |

### Placeholders

| Placeholder | Replaced with                                 |
|-------------|-----------------------------------------------|
| `{file}`    | Absolute path of the current Markdown file    |

If `args` is omitted, the extension defaults to `["{file}"]`.

### Platform examples

**macOS**

```json
{
  "markdownOpenWith.apps": [
    {
      "name": "Typora",
      "command": "/Applications/Typora.app/Contents/MacOS/Typora",
      "args": ["{file}"]
    },
    {
      "name": "Obsidian",
      "command": "open",
      "args": ["-a", "Obsidian", "{file}"]
    }
  ]
}
```

**Windows**

```json
{
  "markdownOpenWith.apps": [
    {
      "name": "Typora",
      "command": "C:\\Program Files\\Typora\\Typora.exe",
      "args": ["{file}"]
    },
    {
      "name": "MarkText",
      "command": "C:\\Program Files\\MarkText\\MarkText.exe",
      "args": ["{file}"]
    }
  ]
}
```

**Linux**

```json
{
  "markdownOpenWith.apps": [
    {
      "name": "Typora",
      "command": "typora",
      "args": ["{file}"]
    },
    {
      "name": "MarkText",
      "command": "marktext",
      "args": ["{file}"]
    }
  ]
}
```

## Security notice

> This extension executes user-configured system commands.
> Only configure trusted applications.

Arguments are passed as an array to `child_process.spawn` — no shell interpolation occurs.

## Development

```bash
npm install
npm run compile
npm run test:unit
```

Press **F5** in VS Code to launch the Extension Development Host.

## License

MIT
