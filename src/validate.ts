import * as vscode from "vscode";

export interface ValidatedFile {
  doc: vscode.TextDocument;
  filePath: string;
}

/**
 * Validates the active editor has a saved Markdown file ready for external opening.
 * Shows appropriate warnings for remote environments, untitled, and dirty files.
 * Returns null if validation fails or the user cancels.
 */
export async function validateMarkdownFile(): Promise<ValidatedFile | null> {
  if (vscode.env.remoteName) {
    vscode.window.showWarningMessage(
      "Markdown Open With runs commands on the extension host and may not work as expected in a remote environment."
    );
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }

  const doc = editor.document;
  if (doc.languageId !== "markdown") {
    return null;
  }

  if (doc.isUntitled) {
    vscode.window.showWarningMessage(
      "Please save the file before opening it with an external application."
    );
    return null;
  }

  if (doc.isDirty) {
    const choice = await vscode.window.showWarningMessage(
      "This file has unsaved changes.",
      "Save & Open",
      "Open Anyway",
      "Cancel"
    );
    if (choice === "Cancel" || !choice) {
      return null;
    }
    if (choice === "Save & Open") {
      const saved = await doc.save();
      if (!saved) {
        vscode.window.showErrorMessage("Failed to save the file.");
        return null;
      }
    }
  }

  return { doc, filePath: doc.uri.fsPath };
}
