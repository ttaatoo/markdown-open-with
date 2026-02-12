import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockValidateMarkdownFile,
  mockGetApps,
  mockSaveApps,
  mockLaunchApp,
  mockReplacePlaceholders,
  mockShowQuickPick,
  mockShowInputBox,
  mockShowOpenDialog,
  mockShowWarningMessage,
  mockShowInformationMessage,
} = vi.hoisted(() => ({
  mockValidateMarkdownFile: vi.fn(),
  mockGetApps: vi.fn(),
  mockSaveApps: vi.fn(),
  mockLaunchApp: vi.fn(),
  mockReplacePlaceholders: vi.fn(),
  mockShowQuickPick: vi.fn(),
  mockShowInputBox: vi.fn(),
  mockShowOpenDialog: vi.fn(),
  mockShowWarningMessage: vi.fn(),
  mockShowInformationMessage: vi.fn(),
}));

vi.mock("vscode", () => ({
  window: {
    showQuickPick: mockShowQuickPick,
    showInputBox: mockShowInputBox,
    showOpenDialog: mockShowOpenDialog,
    showWarningMessage: mockShowWarningMessage,
    showInformationMessage: mockShowInformationMessage,
  },
  QuickPickItemKind: {
    Separator: -1,
    Default: 0,
  },
}));

vi.mock("../../validate", () => ({
  validateMarkdownFile: mockValidateMarkdownFile,
}));

vi.mock("../../config", () => ({
  getApps: mockGetApps,
  saveApps: mockSaveApps,
}));

vi.mock("../../launcher", () => ({
  launchApp: mockLaunchApp,
}));

vi.mock("../../placeholders", () => ({
  replacePlaceholders: mockReplacePlaceholders,
}));

import { showPickerCommand } from "../../open-with-picker";

describe("showPickerCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveApps.mockResolvedValue(undefined);
    mockReplacePlaceholders.mockImplementation((args: string[]) => args);
  });

  it("returns early when validation fails", async () => {
    mockValidateMarkdownFile.mockResolvedValue(null);
    await showPickerCommand();
    expect(mockGetApps).not.toHaveBeenCalled();
  });

  it("shows QuickPick with app items and add option", async () => {
    const apps = [
      { name: "Typora", command: "/usr/bin/typora", args: ["{file}"] },
    ];
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue(apps);
    mockShowQuickPick.mockResolvedValue(undefined);

    await showPickerCommand();

    expect(mockShowQuickPick).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ label: "Typora" }),
        expect.objectContaining({ label: "$(add) Add New Application..." }),
      ]),
      expect.any(Object)
    );
  });

  it("launches selected app", async () => {
    const app = { name: "Typora", command: "/usr/bin/typora", args: ["{file}"] };
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue([app]);
    mockShowQuickPick.mockResolvedValue({ label: "Typora", app });
    mockReplacePlaceholders.mockReturnValue(["/f.md"]);

    await showPickerCommand();

    expect(mockLaunchApp).toHaveBeenCalledWith("/usr/bin/typora", ["/f.md"]);
  });

  it("returns early when user cancels QuickPick", async () => {
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue([]);
    mockShowQuickPick.mockResolvedValue(undefined);

    await showPickerCommand();

    expect(mockLaunchApp).not.toHaveBeenCalled();
  });

  it("returns early when selected item has no app (separator)", async () => {
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue([]);
    mockShowQuickPick.mockResolvedValue({ label: "Some item" });

    await showPickerCommand();

    expect(mockLaunchApp).not.toHaveBeenCalled();
  });

  it("uses default args when app has no args", async () => {
    const app = { name: "Typora", command: "/usr/bin/typora" };
    mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
    mockGetApps.mockReturnValue([app]);
    mockShowQuickPick.mockResolvedValue({ label: "Typora", app });
    mockReplacePlaceholders.mockReturnValue(["/f.md"]);

    await showPickerCommand();

    expect(mockReplacePlaceholders).toHaveBeenCalledWith(["{file}"], "/f.md");
  });

  describe("addNewApplication flow", () => {
    beforeEach(() => {
      mockValidateMarkdownFile.mockResolvedValue({ doc: {}, filePath: "/f.md" });
      mockGetApps.mockReturnValue([]);
    });

    const selectAddNew = () => {
      mockShowQuickPick.mockResolvedValue({
        label: "$(add) Add New Application...",
      });
    };

    it("exits when user cancels name input", async () => {
      selectAddNew();
      mockShowInputBox.mockResolvedValue(undefined);

      await showPickerCommand();

      expect(mockShowOpenDialog).not.toHaveBeenCalled();
      expect(mockSaveApps).not.toHaveBeenCalled();
    });

    it("exits when user cancels file picker", async () => {
      selectAddNew();
      mockShowInputBox.mockResolvedValue("Typora");
      mockShowOpenDialog.mockResolvedValue(undefined);

      await showPickerCommand();

      expect(mockSaveApps).not.toHaveBeenCalled();
    });

    it("exits when file picker returns empty array", async () => {
      selectAddNew();
      mockShowInputBox.mockResolvedValue("Typora");
      mockShowOpenDialog.mockResolvedValue([]);

      await showPickerCommand();

      expect(mockSaveApps).not.toHaveBeenCalled();
    });

    it("saves new app with default args when args input is empty", async () => {
      selectAddNew();
      mockShowInputBox
        .mockResolvedValueOnce("Typora")       // name
        .mockResolvedValueOnce("");             // args (empty)
      mockShowOpenDialog.mockResolvedValue([
        { fsPath: "/usr/bin/typora" },
      ]);
      mockGetApps.mockReturnValue([]);

      await showPickerCommand();

      expect(mockSaveApps).toHaveBeenCalledWith([
        { name: "Typora", command: "/usr/bin/typora", args: ["{file}"] },
      ]);
      expect(mockShowInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("Typora")
      );
    });

    it("saves new app with custom args", async () => {
      selectAddNew();
      mockShowInputBox
        .mockResolvedValueOnce("MyApp")
        .mockResolvedValueOnce("--edit {file}");
      mockShowOpenDialog.mockResolvedValue([
        { fsPath: "/usr/bin/myapp" },
      ]);
      mockGetApps.mockReturnValue([]);

      await showPickerCommand();

      expect(mockSaveApps).toHaveBeenCalledWith([
        { name: "MyApp", command: "/usr/bin/myapp", args: ["--edit {file}"] },
      ]);
    });

    it("trims app name before saving", async () => {
      selectAddNew();
      mockShowInputBox
        .mockResolvedValueOnce("  Typora  ")
        .mockResolvedValueOnce("{file}");
      mockShowOpenDialog.mockResolvedValue([
        { fsPath: "/usr/bin/typora" },
      ]);
      mockGetApps.mockReturnValue([]);

      await showPickerCommand();

      expect(mockSaveApps).toHaveBeenCalledWith([
        expect.objectContaining({ name: "Typora" }),
      ]);
    });

    it("prompts for overwrite on duplicate name", async () => {
      selectAddNew();
      mockShowInputBox
        .mockResolvedValueOnce("Typora")
        .mockResolvedValueOnce("{file}");
      mockShowOpenDialog.mockResolvedValue([
        { fsPath: "/usr/local/bin/typora" },
      ]);
      mockGetApps.mockReturnValue([
        { name: "Typora", command: "/old/typora", args: ["{file}"] },
      ]);
      mockShowWarningMessage.mockResolvedValue("Overwrite");

      await showPickerCommand();

      expect(mockShowWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining("already exists"),
        "Overwrite",
        "Cancel"
      );
      expect(mockSaveApps).toHaveBeenCalledWith([
        { name: "Typora", command: "/usr/local/bin/typora", args: ["{file}"] },
      ]);
    });

    it("exits when user cancels overwrite", async () => {
      selectAddNew();
      mockShowInputBox
        .mockResolvedValueOnce("Typora")
        .mockResolvedValueOnce("{file}");
      mockShowOpenDialog.mockResolvedValue([
        { fsPath: "/usr/local/bin/typora" },
      ]);
      mockGetApps.mockReturnValue([
        { name: "Typora", command: "/old/typora", args: ["{file}"] },
      ]);
      mockShowWarningMessage.mockResolvedValue("Cancel");

      await showPickerCommand();

      expect(mockSaveApps).not.toHaveBeenCalled();
    });

    it("duplicate check is case-insensitive", async () => {
      selectAddNew();
      mockShowInputBox
        .mockResolvedValueOnce("typora")
        .mockResolvedValueOnce("{file}");
      mockShowOpenDialog.mockResolvedValue([
        { fsPath: "/usr/bin/typora" },
      ]);
      mockGetApps.mockReturnValue([
        { name: "Typora", command: "/old/typora", args: ["{file}"] },
      ]);
      mockShowWarningMessage.mockResolvedValue("Overwrite");

      await showPickerCommand();

      expect(mockShowWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining("already exists"),
        "Overwrite",
        "Cancel"
      );
    });
  });
});
