import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

const { mockShowErrorMessage, mockSpawn } = vi.hoisted(() => ({
  mockShowErrorMessage: vi.fn(),
  mockSpawn: vi.fn(),
}));

vi.mock("vscode", () => ({
  window: {
    showErrorMessage: mockShowErrorMessage,
  },
}));

vi.mock("child_process", () => ({
  spawn: mockSpawn,
}));

import { launchApp } from "../../launcher";

describe("launchApp", () => {
  let fakeChild: EventEmitter & { unref: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    fakeChild = Object.assign(new EventEmitter(), { unref: vi.fn() });
    mockSpawn.mockReturnValue(fakeChild);
  });

  it("spawns detached process with correct options", () => {
    launchApp("/usr/bin/app", ["file.md"]);

    expect(mockSpawn).toHaveBeenCalledWith("/usr/bin/app", ["file.md"], {
      detached: true,
      stdio: "ignore",
    });
    expect(fakeChild.unref).toHaveBeenCalled();
  });

  it("shows error message on ENOENT", () => {
    launchApp("/usr/bin/missing", []);

    const err = Object.assign(new Error("not found"), { code: "ENOENT" });
    fakeChild.emit("error", err);

    expect(mockShowErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("Command not found")
    );
  });

  it("shows error message on EACCES", () => {
    launchApp("/usr/bin/noperm", []);

    const err = Object.assign(new Error("permission denied"), { code: "EACCES" });
    fakeChild.emit("error", err);

    expect(mockShowErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("Permission denied")
    );
  });

  it("shows generic error for other failures", () => {
    launchApp("/usr/bin/broken", []);

    const err = Object.assign(new Error("something broke"), { code: "UNKNOWN" });
    fakeChild.emit("error", err);

    expect(mockShowErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining("Failed to launch")
    );
  });
});
