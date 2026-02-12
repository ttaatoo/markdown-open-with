import * as vscode from "vscode";
import { getApps } from "./config";
import { replacePlaceholders } from "./placeholders";
import { launchApp } from "./launcher";
import { AppConfig } from "./types";
import { validateMarkdownFile } from "./validate";

export async function openWithCommand(): Promise<void> {
  const result = await validateMarkdownFile();
  if (!result) {
    return;
  }

  const apps = getApps();
  if (apps.length === 0) {
    const action = await vscode.window.showErrorMessage(
      "No external apps configured for Markdown Open With.",
      "Open Settings"
    );
    if (action === "Open Settings") {
      await vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "markdownOpenWith.apps"
      );
    }
    return;
  }

  let selected: AppConfig;
  if (apps.length === 1 && apps[0]) {
    selected = apps[0];
  } else {
    const items = apps.map((app) => ({
      label: app.name,
      description: app.command,
      app,
    }));

    const pick = await vscode.window.showQuickPick(items, {
      placeHolder: "Select an application to open this file",
    });
    if (!pick) {
      return;
    }
    selected = pick.app;
  }

  const args = replacePlaceholders(selected.args ?? ["{file}"], result.filePath);
  launchApp(selected.command, args);
}
