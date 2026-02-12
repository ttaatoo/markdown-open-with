import { describe, it, expect } from "vitest";
import { replacePlaceholders } from "../../placeholders";

describe("replacePlaceholders", () => {
  it("replaces {file} in a single arg", () => {
    const result = replacePlaceholders(["{file}"], "/path/to/file.md");
    expect(result).toEqual(["/path/to/file.md"]);
  });

  it("replaces {file} in multiple args", () => {
    const result = replacePlaceholders(
      ["--open", "{file}", "--mode", "edit"],
      "/tmp/notes.md"
    );
    expect(result).toEqual(["--open", "/tmp/notes.md", "--mode", "edit"]);
  });

  it("replaces multiple {file} occurrences in a single arg", () => {
    const result = replacePlaceholders(["{file}:{file}"], "/a.md");
    expect(result).toEqual(["/a.md:/a.md"]);
  });

  it("returns args unchanged when no placeholders exist", () => {
    const result = replacePlaceholders(["--flag", "value"], "/path.md");
    expect(result).toEqual(["--flag", "value"]);
  });

  it("returns empty array for empty args", () => {
    const result = replacePlaceholders([], "/path.md");
    expect(result).toEqual([]);
  });

  it("handles file paths with spaces", () => {
    const result = replacePlaceholders(
      ["{file}"],
      "/Users/me/My Documents/notes.md"
    );
    expect(result).toEqual(["/Users/me/My Documents/notes.md"]);
  });

  it("handles file paths with special characters", () => {
    const result = replacePlaceholders(
      ["{file}"],
      "/path/to/file (1).md"
    );
    expect(result).toEqual(["/path/to/file (1).md"]);
  });
});
