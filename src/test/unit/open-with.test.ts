import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockValidateMarkdownFile,
  mockGetApps,
  mockLaunchApp,
  mockReplacePlaceholders,
  mockShowErrorMessage,
  mockShowQuickPick,
  mockExecuteCommand,
} = vi.hoisted(() => ({
  mockValidateMarkdownFile: vi.fn(),
  mockGetApps: vi.fn(),
  mockLaunchApp: vi.fn(),
  mockReplacePlaceholders: vi.fn(),
  mockShowErrorMessage: vi.fn(),
  mockShowQuickPick: vi.fn(),
  mockExecuteCommand: vi.fn(),
}));

vi.mock("vscode", () => ({
  window: {
    showErrorMessage: mockShowErrorMessage,
    showQuickPick: mockShowQuickPick,
  },
  commands: {
    executeCommand: mockExecuteCommand,
  },
}));

vi.mock("../../validate", () => ({
  validateMarkdownFile: mockValidateMarkdownFile,
}));

vi.mock("../../config", () => ({
  getApps: mockGetApps,
}));

vi.mock("../../launcher", () => ({
  launchApp: mockLaunchApp,
}));

vi.mock("../../placeholders", () => ({
  replacePlaceholders: mockReplacePlaceholders,
}));

import { openWithCommand } from "../../open-with";

describe("openWithCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReplacePlaceholders.mockImplementation((args: string[]) => args);
  });

  it("returns early when validation fails", async () => {
    mockValidateMarkdownFile.mockResolvedValue(null);
    await openWithCommand();
    expect(mockGetApps).not.toHaveBeenCalled();
  });

  it("shows error when no apps configured", async () => {
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue([]);
    mockShowErrorMessage.mockResolvedValue(undefined);

    await openWithCommand();

    expect(mockShowErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("No external apps configured"),
      "Open Settings"
    );
    expect(mockLaunchApp).not.toHaveBeenCalled();
  });

  it("opens settings when user clicks 'Open Settings'", async () => {
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue([]);
    mockShowErrorMessage.mockResolvedValue("Open Settings");

    await openWithCommand();

    expect(mockExecuteCommand).toHaveBeenCalledWith(
      "workbench.action.openSettings",
      "markdownOpenWith.apps"
    );
  });

  it("launches directly when only one app configured", async () => {
    const app = { name: "Typora", command: "/usr/bin/typora", args: ["{file}"] };
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/docs/readme.md" });
    mockGetApps.mockReturnValue([app]);
    mockReplacePlaceholders.mockReturnValue(["/docs/readme.md"]);

    await openWithCommand();

    expect(mockShowQuickPick).not.toHaveBeenCalled();
    expect(mockReplacePlaceholders).toHaveBeenCalledWith(["{file}"], "/docs/readme.md");
    expect(mockLaunchApp).toHaveBeenCalledWith("/usr/bin/typora", ["/docs/readme.md"]);
  });

  it("shows QuickPick when multiple apps configured", async () => {
    const apps = [
      { name: "Typora", command: "/usr/bin/typora" },
      { name: "Obsidian", command: "/usr/bin/obsidian" },
    ];
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue(apps);
    mockShowQuickPick.mockResolvedValue({ label: "Obsidian", app: apps[1] });
    mockReplacePlaceholders.mockReturnValue(["/f.md"]);

    await openWithCommand();

    expect(mockShowQuickPick).toHaveBeenCalled();
    expect(mockLaunchApp).toHaveBeenCalledWith("/usr/bin/obsidian", ["/f.md"]);
  });

  it("returns early when user cancels QuickPick", async () => {
    const apps = [
      { name: "Typora", command: "/usr/bin/typora" },
      { name: "Obsidian", command: "/usr/bin/obsidian" },
    ];
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue(apps);
    mockShowQuickPick.mockResolvedValue(undefined);

    await openWithCommand();

    expect(mockLaunchApp).not.toHaveBeenCalled();
  });

  it("uses default args [{file}] when app has no args", async () => {
    const app = { name: "Typora", command: "/usr/bin/typora" };
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue([app]);
    mockReplacePlaceholders.mockReturnValue(["/f.md"]);

    await openWithCommand();

    expect(mockReplacePlaceholders).toHaveBeenCalledWith(["{file}"], "/f.md");
  });
});
