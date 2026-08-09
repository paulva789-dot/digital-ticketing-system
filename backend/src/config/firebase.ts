import admin from "firebase-admin";
import { env, isFirebaseConfigured } from "./env";

if (isFirebaseConfigured && admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
  });
}

export const firebaseAdmin = isFirebaseConfigured ? admin : null;
