import * as admin from 'firebase-admin';
import { User } from "./mongodb";
import { logger } from "./utils";
import { IDataNotification, INotification } from "./types"
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


export const sendInvoicePaidNotification = async ({hash, amount, uid}) => {
  const data: IDataNotification = {
    type: "paid-invoice",
    hash,
    amount,
  }
  await sendNotification({uid, title: `You receive a payment of ${amount} sats`, data})
}


export const sendNotification = async ({uid, title, body, data}: INotification) => {

  const user = await User.findOne({ _id: uid })
  const message = {
    // only string can be sent to notifications
    data: {
      ...mapValues(data, v => String(v)),
      // title,
      // body,
    }, 

    // if we set notification, it will appears on both background and quit stage for iOS. 
    // if we don't set notidications, this will appear for background but not quit stage
    // we may be able to use data only, but this should be implemented first:
    // https://rnfirebase.io/messaging/usage#background-application-state
    // 
    notification: {
      title,
    },
  }

  if (body) {
    message['notification']['body'] = body
  }
  
  console.log({message})

  const response = await admin.messaging().sendToDevice(
    user.deviceToken,
    message as any,
    {
      // Required for background/quit data-only messages on iOS
      // contentAvailable: true,
      // Required for background/quit data-only messages on Android
      // priority: 'high',
    },
    )
  // FIXME: any as a workaround to https://github.com/Microsoft/TypeScript/issues/15300

  logger.info(response.successCount + ' messages were sent successfully');

}
