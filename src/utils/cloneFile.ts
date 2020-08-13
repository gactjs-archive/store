export function cloneFile(file: File): File {
  return new File([file.slice()], file.name, {
    lastModified: file.lastModified,
    type: file.type
  });
}
