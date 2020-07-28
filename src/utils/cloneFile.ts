export function cloneFile(file: File): File {
  return new File([file.slice()], file.name, {
    type: file.type,
    lastModified: file.lastModified
  });
}
