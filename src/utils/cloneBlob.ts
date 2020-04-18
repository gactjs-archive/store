export default function cloneBlob(blob: Blob): Blob {
  return new Blob([blob.slice()], { type: blob.type });
}
