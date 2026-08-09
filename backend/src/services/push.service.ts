import { firebaseAdmin } from "../config/firebase";

/** Sends an FCM push to a device token. No-ops (with a log) if Firebase isn't configured. */
export async function sendPush(deviceToken: string, title: string, body: string): Promise<void> {
  if (!firebaseAdmin) {
    console.log(`[push:stub] token=${deviceToken} title="${title}" body="${body}"`);
    return;
  }
  await firebaseAdmin.messaging().send({
    token: deviceToken,
    notification: { title, body },
  });
}
