import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGet, mockUpdate } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: () => ({
      get: mockGet,
      update: mockUpdate,
    }),
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
  },
}));

import { getApps, saveApps } from "../../config";

describe("getApps", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockUpdate.mockReset();
  });

  it("returns valid app configs", () => {
    mockGet.mockReturnValue([
      { name: "Typora", command: "/usr/bin/typora" },
      { name: "Obsidian", command: "obsidian", args: ["{file}"] },
    ]);
    const apps = getApps();
    expect(apps).toHaveLength(2);
    expect(apps[0].name).toBe("Typora");
    expect(apps[1].args).toEqual(["{file}"]);
  });

  it("filters out entries with missing name", () => {
    mockGet.mockReturnValue([
      { command: "/usr/bin/typora" },
      { name: "Valid", command: "/usr/bin/valid" },
    ]);
    const apps = getApps();
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("Valid");
  });

  it("filters out entries with missing command", () => {
    mockGet.mockReturnValue([
      { name: "NoCmd" },
      { name: "Valid", command: "/usr/bin/valid" },
    ]);
    const apps = getApps();
    expect(apps).toHaveLength(1);
  });

  it("filters out entries with empty name", () => {
    mockGet.mockReturnValue([
      { name: "", command: "/usr/bin/foo" },
    ]);
    expect(getApps()).toHaveLength(0);
  });

  it("filters out entries with empty command", () => {
    mockGet.mockReturnValue([
      { name: "App", command: "" },
    ]);
    expect(getApps()).toHaveLength(0);
  });

  it("filters out non-object entries", () => {
    mockGet.mockReturnValue(["string", 42, null, undefined]);
    expect(getApps()).toHaveLength(0);
  });

  it("returns empty array when config is undefined", () => {
    mockGet.mockReturnValue(undefined);
    expect(getApps()).toEqual([]);
  });

  it("returns empty array when config is empty", () => {
    mockGet.mockReturnValue([]);
    expect(getApps()).toEqual([]);
  });

  it("filters out entries with non-string args", () => {
    mockGet.mockReturnValue([
      { name: "Bad", command: "/usr/bin/app", args: [123, null] },
      { name: "Good", command: "/usr/bin/app", args: ["{file}"] },
    ]);
    const apps = getApps();
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("Good");
  });

  it("filters out entries with non-array args", () => {
    mockGet.mockReturnValue([
      { name: "Bad", command: "/usr/bin/app", args: "not-an-array" },
    ]);
    expect(getApps()).toHaveLength(0);
  });

  it("accepts entries with undefined args", () => {
    mockGet.mockReturnValue([
      { name: "NoArgs", command: "/usr/bin/app" },
    ]);
    expect(getApps()).toHaveLength(1);
  });
});

describe("saveApps", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockUpdate.mockResolvedValue(undefined);
  });

  it("saves apps to global configuration", async () => {
    const apps = [{ name: "Typora", command: "/usr/bin/typora", args: ["{file}"] }];
    await saveApps(apps);
    expect(mockUpdate).toHaveBeenCalledWith("apps", apps, 1); // ConfigurationTarget.Global = 1
  });

  it("awaits the config update", async () => {
    let resolved = false;
    mockUpdate.mockImplementation(() => new Promise<void>((resolve) => {
      setTimeout(() => { resolved = true; resolve(); }, 0);
    }));

    const promise = saveApps([]);
    expect(resolved).toBe(false);
    await promise;
    expect(resolved).toBe(true);
  });
});
