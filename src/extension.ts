import * as vscode from "vscode";
import { openWithCommand } from "./open-with";
import { OpenWithCodeLensProvider } from "./open-with-codelens";
import { showPickerCommand } from "./open-with-picker";

export function activate(context: vscode.ExtensionContext): void {
  const openWithDisposable = vscode.commands.registerCommand(
    "markdownOpenWith.open",
    openWithCommand
  );
  context.subscriptions.push(openWithDisposable);

  const pickerDisposable = vscode.commands.registerCommand(
    "markdownOpenWith.showPicker",
    showPickerCommand
  );
  context.subscriptions.push(pickerDisposable);

  const codeLensProvider = new OpenWithCodeLensProvider();
  const codeLensRegistration = vscode.languages.registerCodeLensProvider(
    { language: "markdown" },
    codeLensProvider
  );
  context.subscriptions.push(codeLensRegistration);
  context.subscriptions.push(codeLensProvider);
}

export function deactivate(): void {}
