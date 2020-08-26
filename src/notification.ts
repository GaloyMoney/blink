import * as admin from 'firebase-admin';
import { User } from "./mongodb";
import { logger } from "./utils";
import { INotification } from "./types"
import { mapValues } from "lodash";

// The key GOOGLE_APPLICATION_CREDENTIALS should be set in production
// This key defined the path of the config file that include the key
// more info at https://firebase.google.com/docs/admin/setup
// TODO: mock up the function for devnet
if(process.env.GOOGLE_APPLICATION_CREDENTIALS) { 
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}

export const sendNotification = async ({uid, title, body, data}: INotification) => {

  const user = await User.findOne({ _id: uid })
  const message = {
    // only string can be sent to notifications
    data: mapValues(data, v => String(v)), 
    // fcmOptions: {}
    // apns: {}
    notification: {
      title,
      body
    },
    tokens: user.deviceToken
  }

  console.log({message})

  const response = await admin.messaging().sendMulticast(message as any)
  // FIXME: any as a workaround to https://github.com/Microsoft/TypeScript/issues/15300

  logger.info(response.successCount + ' messages were sent successfully');

}
