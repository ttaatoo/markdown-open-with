import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { OpenWithCodeLensProvider } from "../../open-with-codelens";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

const createMockRange = (startLine: number, startChar: number, endLine: number, endChar: number) =>
  ({ startLine, startCharacter: startChar, endLine, endCharacter: endChar });

const createMockCodeLens = (range: ReturnType<typeof createMockRange>, command?: { title: string; command: string; arguments?: unknown[] }) =>
  ({ range, command });

vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: () => ({
      get: mockGet,
    }),
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
  },
  EventEmitter: class EventEmitter {
    event = () => {};
    fire() {}
    dispose() {}
  },
  Range: class Range {
    constructor(
      public readonly startLine: number,
      public readonly startCharacter: number,
      public readonly endLine: number,
      public readonly endCharacter: number
    ) {}
  },
  CodeLens: class CodeLens {
    constructor(
      public readonly range: { startLine: number; startCharacter: number; endLine: number; endCharacter: number },
      public command?: { title: string; command: string; arguments?: unknown[] }
    ) {}
  },
}));

describe("OpenWithCodeLensProvider", () => {
  let provider: OpenWithCodeLensProvider;

  beforeEach(() => {
    provider = new OpenWithCodeLensProvider();
    mockGet.mockReset();
  });

  const createMockDocument = (overrides: Partial<{
    languageId: string;
    isUntitled: boolean;
    lineCount: number;
    uri: vscode.Uri;
  }> = {}): vscode.TextDocument =>
    ({
      languageId: "markdown",
      isUntitled: false,
      lineCount: 10,
      uri: { fsPath: "/path/to/file.md" } as vscode.Uri,
      ...overrides,
    }) as vscode.TextDocument;

  describe("provideCodeLenses", () => {
    describe("document filtering", () => {
      it("returns empty array for non-Markdown files", () => {
        const doc = createMockDocument({ languageId: "typescript" });
        expect(provider.provideCodeLenses(doc)).toEqual([]);
      });

      it("returns empty array for untitled files", () => {
        mockGet.mockReturnValue([{ name: "Typora", command: "/usr/bin/typora" }]);
        const doc = createMockDocument({ isUntitled: true });
        expect(provider.provideCodeLenses(doc)).toEqual([]);
      });
    });

    describe("config filtering", () => {
      it("returns empty array when no apps configured", () => {
        mockGet.mockReturnValue([]);
        expect(provider.provideCodeLenses(createMockDocument())).toEqual([]);
      });

      it("returns empty array when config is undefined", () => {
        mockGet.mockReturnValue(undefined);
        expect(provider.provideCodeLenses(createMockDocument())).toEqual([]);
      });

      it("filters out apps with missing name", () => {
        mockGet.mockReturnValue([
          { command: "/usr/bin/typora" },
          { name: "Valid", command: "/usr/bin/valid" },
        ]);
        const lenses = provider.provideCodeLenses(createMockDocument()) ?? [];
        expect(lenses).toHaveLength(2);
        expect((lenses[0] as vscode.CodeLens).command?.title).toBe("Open With: Valid");
      });

      it("filters out apps with missing command", () => {
        mockGet.mockReturnValue([
          { name: "NoCmd" },
          { name: "Valid", command: "/usr/bin/valid" },
        ]);
        const lenses = provider.provideCodeLenses(createMockDocument()) ?? [];
        expect(lenses).toHaveLength(2);
      });

      it("filters out apps with empty name", () => {
        mockGet.mockReturnValue([{ name: "", command: "/usr/bin/typora" }]);
        expect(provider.provideCodeLenses(createMockDocument())).toEqual([]);
      });

      it("filters out apps with empty command", () => {
        mockGet.mockReturnValue([{ name: "App", command: "" }]);
        expect(provider.provideCodeLenses(createMockDocument())).toEqual([]);
      });

      it("filters out non-object entries", () => {
        mockGet.mockReturnValue(["string", 42, null, undefined]);
        expect(provider.provideCodeLenses(createMockDocument())).toEqual([]);
      });
    });

    describe("valid Markdown with apps configured", () => {
      const defaultApps = [{ name: "Typora", command: "/usr/bin/typora" }];

      beforeEach(() => {
        mockGet.mockReturnValue(defaultApps);
      });

      it("returns exactly 2 CodeLens elements", () => {
        const lenses = provider.provideCodeLenses(createMockDocument()) ?? [];
        expect(lenses).toHaveLength(2);
      });

      it("primary lens has correct title and command", () => {
        const [leftLens] = (provider.provideCodeLenses(createMockDocument()) ?? []) as vscode.CodeLens[];
        expect(leftLens.command?.title).toBe("Open With: Typora");
        expect(leftLens.command?.command).toBe("markdownOpenWith.open");
        expect(leftLens.command?.arguments).toEqual([]);
      });

      it("dropdown lens has correct title and command", () => {
        const [, rightLens] = (provider.provideCodeLenses(createMockDocument()) ?? []) as vscode.CodeLens[];
        expect(rightLens.command?.title).toBe("▾");
        expect(rightLens.command?.command).toBe("markdownOpenWith.showPicker");
        expect(rightLens.command?.arguments).toEqual([]);
      });

      it("both lenses have range at line 0, character 0", () => {
        const lenses = provider.provideCodeLenses(createMockDocument()) ?? [];
        const [leftLens, rightLens] = lenses as vscode.CodeLens[];
        const rangeShape = (r: unknown) => r as { startLine: number; startCharacter: number };
        expect(rangeShape(leftLens.range).startLine).toBe(0);
        expect(rangeShape(leftLens.range).startCharacter).toBe(0);
        expect(rangeShape(rightLens.range).startLine).toBe(0);
        expect(rangeShape(rightLens.range).startCharacter).toBe(0);
      });

      it("shows first app when multiple apps configured", () => {
        mockGet.mockReturnValue([
          { name: "Typora", command: "/usr/bin/typora" },
          { name: "Obsidian", command: "/usr/bin/obsidian" },
          { name: "MarkText", command: "/usr/bin/marktext" },
        ]);
        const [leftLens] = (provider.provideCodeLenses(createMockDocument()) ?? []) as vscode.CodeLens[];
        expect(leftLens.command?.title).toBe("Open With: Typora");
      });
    });
  });

  describe("resolveCodeLens", () => {
    it("returns the CodeLens unchanged", () => {
      const mockRange = createMockRange(0, 0, 0, 0);
      const mockLens = createMockCodeLens(mockRange);
      const resolved = provider.resolveCodeLens(
        mockLens as unknown as vscode.CodeLens,
        {} as vscode.CancellationToken
      );
      expect(resolved).toBe(mockLens);
    });
  });
});
