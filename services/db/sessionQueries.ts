import { openDatabaseSync } from 'expo-sqlite';

export async function attachBetaClipToSet(
  setId: string,
  videoUri: string,
  cruxTimestampMs?: number,
  hangTimeSeconds?: number
): Promise<void> {
  const db = openDatabaseSync('cruxlog.db');
  await db.runAsync(
    `UPDATE boulder_logs 
     SET media_uri = ?, 
         crux_timestamp_ms = ?, 
         hang_time_seconds = ?
     WHERE id = ?;`,
    [videoUri, cruxTimestampMs ?? null, hangTimeSeconds ?? null, setId]
  );
}
