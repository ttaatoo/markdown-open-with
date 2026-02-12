import { spawn } from "child_process";
import * as vscode from "vscode";

export function launchApp(command: string, args: string[]): void {
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
  });

  child.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") {
      vscode.window.showErrorMessage(
        `Command not found: "${command}". Check the path in your Markdown Open With settings.`
      );
    } else if (err.code === "EACCES") {
      vscode.window.showErrorMessage(
        `Permission denied: "${command}". Check file permissions.`
      );
    } else {
      vscode.window.showErrorMessage(
        `Failed to launch "${command}": ${err.message}`
      );
    }
  });

  child.unref();
}
