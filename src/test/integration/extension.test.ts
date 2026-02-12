import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Integration", () => {
  test("extension is present", () => {
    const extension = vscode.extensions.getExtension("ttaatoo.markdown-open-with");
    assert.ok(extension, "Extension should be found");
  });

  test("extension activates on markdown", async () => {
    const extension = vscode.extensions.getExtension("ttaatoo.markdown-open-with");
    assert.ok(extension);
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test("command is registered", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("markdownOpenWith.open"),
      'Command "markdownOpenWith.open" should be registered'
    );
  });
});
