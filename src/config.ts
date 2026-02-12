import * as vscode from "vscode";
import { AppConfig } from "./types";

export function getApps(): AppConfig[] {
  const config = vscode.workspace.getConfiguration("markdownOpenWith");
  const raw: unknown[] = config.get<unknown[]>("apps") ?? [];

  return raw.filter((entry): entry is AppConfig => {
    if (typeof entry !== "object" || entry === null) {
      return false;
    }
    const obj = entry as Record<string, unknown>;
    if (typeof obj.name !== "string" || obj.name.length === 0) {
      return false;
    }
    if (typeof obj.command !== "string" || obj.command.length === 0) {
      return false;
    }
    if (obj.args !== undefined) {
      if (!Array.isArray(obj.args) || !obj.args.every((a: unknown) => typeof a === "string")) {
        return false;
      }
    }
    return true;
  });
}

export async function saveApps(apps: AppConfig[]): Promise<void> {
  const config = vscode.workspace.getConfiguration("markdownOpenWith");
  await config.update("apps", apps, vscode.ConfigurationTarget.Global);
}
