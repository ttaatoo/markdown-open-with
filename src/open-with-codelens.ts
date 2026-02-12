import * as vscode from "vscode";
import { getApps } from "./config";

export class OpenWithCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private _configListener: vscode.Disposable;

  constructor() {
    this._configListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("markdownOpenWith.apps")) {
        this._onDidChangeCodeLenses.fire();
      }
    });
  }

  dispose(): void {
    this._configListener.dispose();
    this._onDidChangeCodeLenses.dispose();
  }

  provideCodeLenses(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    if (document.languageId !== "markdown") {
      return [];
    }

    if (document.isUntitled) {
      return [];
    }

    const apps = getApps();
    if (apps.length === 0) {
      return [];
    }

    const range = new vscode.Range(0, 0, 0, 0);
    const lenses: vscode.CodeLens[] = [];

    const defaultApp = apps[0]!;
    const leftLens = new vscode.CodeLens(range);
    leftLens.command = {
      title: `Open With: ${defaultApp.name}`,
      command: "markdownOpenWith.open",
      arguments: [],
    };
    lenses.push(leftLens);

    const rightLens = new vscode.CodeLens(range);
    rightLens.command = {
      title: "▾",
      command: "markdownOpenWith.showPicker",
      arguments: [],
    };
    lenses.push(rightLens);

    return lenses;
  }

  resolveCodeLens(
    codeLens: vscode.CodeLens,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    return codeLens;
  }
}
