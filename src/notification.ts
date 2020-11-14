import * as admin from 'firebase-admin';
import { User } from "./mongodb";
import { IDataNotification, INotification } from "./types"
import { mapValues } from "lodash";
import { Price } from "./priceImpl";

// The key GOOGLE_APPLICATION_CREDENTIALS should be set in production
// This key defined the path of the config file that include the key
// more info at https://firebase.google.com/docs/admin/setup
// TODO: mock up the function for devnet
if(process.env.GOOGLE_APPLICATION_CREDENTIALS) { 
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}


export const sendInvoicePaidNotification = async ({hash, amount, uid, logger}) => {
  const satsPrice = await new Price({ logger }).lastPrice()

  const data: IDataNotification = {
    type: "paid-invoice",
    hash,
    amount,
  }

  const usd = (amount * satsPrice).toFixed(2)
  // TODO dedupe from trigger.ts
  await sendNotification({uid, title: `You received $${usd} | ${amount} sats`, data, logger})
}


export const sendNotification = async ({uid, title, body, data, logger}: INotification) => {

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

  if (user.deviceToken.length === 1 && user.deviceToken[0] === "test") {
    logger.info({message}, "test token. skipping notification for user %o", uid)
    return
  }

  if (user.deviceToken.length === 0) {
    logger.info({message}, "skipping notification for user %o as no deviceToken has been registered", uid)
    return
  }

  logger.info({message}, "sending notification for user %o", uid)

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
  logger.info({response, uid, title, body, data}, 'notification was sent successfully')
}
