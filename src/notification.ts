import * as admin from 'firebase-admin';
import { User } from "./mongodb";
import { logger } from "./utils";
const serviceAccount = require("./galoyapp-firebase-serviceaccont.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const sendNotification = async ({uid, title, body}) => {

  const user = await User.findOne({ _id: uid })
  const message = {
    // data: {score: '850', time: '2:45'},
    // fcmOptions: {}
    // apns: {}
    notification:{
      title,
      body
    },
    tokens: user.deviceToken
  }

  const response = await admin.messaging().sendMulticast(message)  
  logger.info(response.successCount + ' messages were sent successfully');

}