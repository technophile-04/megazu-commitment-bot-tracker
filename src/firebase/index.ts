import { firestore } from "firebase-admin";

export async function acquireLock(
  lockRef: firestore.DocumentReference,
  maxWaitTime: number = 10000,
  db: firestore.Firestore,
): Promise<boolean> {
  const lockExpiration = Date.now() + 10000; // Lock expires after 10 seconds

  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(lockRef);
    if (!doc.exists || doc.data()!.expiresAt < Date.now()) {
      transaction.set(lockRef, { expiresAt: lockExpiration });
      return true;
    }
    return false;
  });

  if (result) return true;

  // If we couldn't acquire the lock, wait and try again
  if (maxWaitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return acquireLock(lockRef, maxWaitTime - 100, db);
  }

  return false;
}

export async function releaseLock(lockRef: firestore.DocumentReference) {
  await lockRef.delete();
}
