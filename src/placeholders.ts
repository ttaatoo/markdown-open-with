const FILE_PLACEHOLDER = /\{file\}/g;

export function replacePlaceholders(args: string[], filePath: string): string[] {
  return args.map((arg) => arg.replace(FILE_PLACEHOLDER, () => filePath));
}
