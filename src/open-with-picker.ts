import * as vscode from "vscode";
import { getApps, saveApps } from "./config";
import { launchApp } from "./launcher";
import { replacePlaceholders } from "./placeholders";
import { AppConfig } from "./types";
import { validateMarkdownFile } from "./validate";

interface AppQuickPickItem extends vscode.QuickPickItem {
  app?: AppConfig;
}

export async function showPickerCommand(): Promise<void> {
  const result = await validateMarkdownFile();
  if (!result) {
    return;
  }

  const apps = getApps();

  // Build QuickPick items with attached AppConfig
  const items: AppQuickPickItem[] = apps.map((app) => ({
    label: app.name,
    description: app.command,
    detail: app.args?.length
      ? `Args: ${app.args.join(" ")}`
      : "Default: {file}",
    app,
  }));

  // Add "Add New Application" option
  items.push({
    label: "$(add) Add New Application...",
    description: "Configure a new application manually",
    alwaysShow: true,
  });

  // Show separator hint if no apps configured
  if (apps.length === 0) {
    items.unshift({
      label: "No applications configured",
      kind: vscode.QuickPickItemKind.Separator,
    });
  }

  const pick = await vscode.window.showQuickPick(items, {
    placeHolder: "Select an application to open this file",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!pick) {
    return;
  }

  // Handle "Add New Application..."
  if (pick.label.startsWith("$(add) Add New Application")) {
    await addNewApplication();
    return;
  }

  // Handle regular app selection
  if (!pick.app) {
    return;
  }

  const args = replacePlaceholders(pick.app.args ?? ["{file}"], result.filePath);
  launchApp(pick.app.command, args);
}

async function addNewApplication(): Promise<void> {
  // Step 1: Get display name
  const name = await vscode.window.showInputBox({
    placeHolder: "Display name (e.g., Typora)",
    prompt: "Enter a name for this application",
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "Name is required";
      }
      return null;
    },
  });

  if (!name) {
    return;
  }

  // Step 2: Get application path (with file picker)
  const pickedUri = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    openLabel: "Select Application",
    filters: {
      Applications: ["app", "exe", ""],
      "All Files": ["*"],
    },
    title: "Select Application to Open Markdown Files",
  });

  const selectedUri = pickedUri?.[0];
  if (!selectedUri) {
    return;
  }

  const command = selectedUri.fsPath;

  // Step 3: Get arguments (optional)
  const argsInput = await vscode.window.showInputBox({
    placeHolder: "{file} (press Enter for default)",
    prompt: "Enter arguments (use {file} as placeholder for the file path)",
    value: "{file}",
  });

  const args = argsInput && argsInput.trim() !== "" ? [argsInput] : ["{file}"];

  // Step 4: Save to configuration
  const newApp: AppConfig = {
    name: name.trim(),
    command,
    args,
  };

  const currentApps = getApps();

  // Check for duplicate names
  const existingIndex = currentApps.findIndex(
    (app) => app.name.toLowerCase() === newApp.name.toLowerCase()
  );

  if (existingIndex >= 0) {
    const overwrite = await vscode.window.showWarningMessage(
      `An application named "${newApp.name}" already exists. Overwrite?`,
      "Overwrite",
      "Cancel"
    );

    if (overwrite !== "Overwrite") {
      return;
    }

    currentApps[existingIndex] = newApp;
  } else {
    currentApps.push(newApp);
  }

  await saveApps(currentApps);

  vscode.window.showInformationMessage(
    `Added "${newApp.name}" to Markdown Open With.`
  );
}
