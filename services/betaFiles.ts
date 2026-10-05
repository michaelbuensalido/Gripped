// On-device storage for beta video clips.
// `expo-file-system` is required lazily so pure-logic and SQLite unit tests
// (node environment) can import the query layer without the native module.

const ROOT = 'beta-videos';

function fs() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-file-system') as typeof import('expo-file-system');
}

export interface StoredClip {
  uri: string;
  sizeBytes: number;
}

/** Copies a recorded/picked clip into the app's document dir: <doc>/beta-videos/<projectId>/<fileId>.<ext>. */
export function storeClip(sourceUri: string, projectId: string, fileId: string): StoredClip {
  const { Directory, File, Paths } = fs();
  const dir = new Directory(Paths.document, ROOT, projectId);
  dir.create({ intermediates: true, idempotent: true });
  const ext = (sourceUri.split('?')[0].split('.').pop() || 'mp4').toLowerCase();
  const dest = new File(dir, `${fileId}.${ext}`);
  new File(sourceUri).copy(dest);
  return { uri: dest.uri, sizeBytes: dest.size ?? 0 };
}

/** Deletes one clip file. Never throws: a missing file must not block removing the DB row. */
export function deleteClipFile(uri: string): void {
  try {
    const { File } = fs();
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignore: the file is already gone or unreadable
  }
}

/** Removes a project's whole clip folder (used by cascade delete as a safety net). */
export function deleteProjectClipDir(projectId: string): void {
  try {
    const { Directory, Paths } = fs();
    const dir = new Directory(Paths.document, ROOT, projectId);
    if (dir.exists) dir.delete();
  } catch {
    // ignore
  }
}
