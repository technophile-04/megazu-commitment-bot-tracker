import * as admin from "firebase-admin";

export function initializeFirebase() {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = admin.firestore();

export async function acquireLock(
  lockRef: admin.firestore.DocumentReference,
  maxWaitTime: number = 10000,
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
    return acquireLock(lockRef, maxWaitTime - 100);
  }

  return false;
}

export async function releaseLock(lockRef: admin.firestore.DocumentReference) {
  await lockRef.delete();
}
