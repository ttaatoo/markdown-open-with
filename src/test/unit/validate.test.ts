import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockRemoteName,
  mockActiveTextEditor,
  mockShowWarningMessage,
  mockShowErrorMessage,
} = vi.hoisted(() => ({
  mockRemoteName: { value: undefined as string | undefined },
  mockActiveTextEditor: { value: undefined as unknown },
  mockShowWarningMessage: vi.fn(),
  mockShowErrorMessage: vi.fn(),
}));

vi.mock("vscode", () => ({
  env: {
    get remoteName() {
      return mockRemoteName.value;
    },
  },
  window: {
    get activeTextEditor() {
      return mockActiveTextEditor.value;
    },
    showWarningMessage: mockShowWarningMessage,
    showErrorMessage: mockShowErrorMessage,
  },
}));

import { validateMarkdownFile } from "../../validate";

describe("validateMarkdownFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoteName.value = undefined;
    mockActiveTextEditor.value = undefined;
  });

  const createMockEditor = (overrides: {
    languageId?: string;
    isUntitled?: boolean;
    isDirty?: boolean;
    fsPath?: string;
    save?: () => Promise<boolean>;
  } = {}) => ({
    document: {
      languageId: overrides.languageId ?? "markdown",
      isUntitled: overrides.isUntitled ?? false,
      isDirty: overrides.isDirty ?? false,
      uri: { fsPath: overrides.fsPath ?? "/path/to/file.md" },
      save: overrides.save ?? vi.fn().mockResolvedValue(true),
    },
  });

  it("returns null when no active editor", async () => {
    mockActiveTextEditor.value = undefined;
    expect(await validateMarkdownFile()).toBeNull();
  });

  it("returns null for non-markdown files", async () => {
    mockActiveTextEditor.value = createMockEditor({ languageId: "typescript" });
    expect(await validateMarkdownFile()).toBeNull();
  });

  it("returns null and warns for untitled files", async () => {
    mockActiveTextEditor.value = createMockEditor({ isUntitled: true });
    expect(await validateMarkdownFile()).toBeNull();
    expect(mockShowWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining("save the file")
    );
  });

  it("shows warning in remote environment", async () => {
    mockRemoteName.value = "ssh-remote";
    mockActiveTextEditor.value = createMockEditor();
    await validateMarkdownFile();
    expect(mockShowWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining("remote environment")
    );
  });

  it("returns file info for clean saved markdown file", async () => {
    mockActiveTextEditor.value = createMockEditor({ fsPath: "/docs/readme.md" });
    const result = await validateMarkdownFile();
    expect(result).toEqual({
      doc: expect.objectContaining({ languageId: "markdown" }),
      filePath: "/docs/readme.md",
    });
  });

  describe("dirty file handling", () => {
    it("returns null when user cancels", async () => {
      mockActiveTextEditor.value = createMockEditor({ isDirty: true });
      mockShowWarningMessage.mockResolvedValue("Cancel");
      expect(await validateMarkdownFile()).toBeNull();
    });

    it("returns null when user dismisses dialog", async () => {
      mockActiveTextEditor.value = createMockEditor({ isDirty: true });
      mockShowWarningMessage.mockResolvedValue(undefined);
      expect(await validateMarkdownFile()).toBeNull();
    });

    it("saves and returns file info on 'Save & Open'", async () => {
      const save = vi.fn().mockResolvedValue(true);
      mockActiveTextEditor.value = createMockEditor({ isDirty: true, save });
      mockShowWarningMessage.mockResolvedValue("Save & Open");

      const result = await validateMarkdownFile();
      expect(save).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it("returns null and shows error when save fails", async () => {
      const save = vi.fn().mockResolvedValue(false);
      mockActiveTextEditor.value = createMockEditor({ isDirty: true, save });
      mockShowWarningMessage.mockResolvedValue("Save & Open");

      expect(await validateMarkdownFile()).toBeNull();
      expect(mockShowErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Failed to save")
      );
    });

    it("skips save on 'Open Anyway'", async () => {
      const save = vi.fn();
      mockActiveTextEditor.value = createMockEditor({ isDirty: true, save });
      mockShowWarningMessage.mockResolvedValue("Open Anyway");

      const result = await validateMarkdownFile();
      expect(save).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });
});
