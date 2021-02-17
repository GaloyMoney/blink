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


export const sendInvoicePaidNotification = async ({hash, amount, user, logger}) => {
  const satsPrice = await new Price({ logger }).lastPrice()

  const data: IDataNotification = {
    type: "paid-invoice",
    hash,
    amount,
  }

  const usd = (amount * satsPrice).toFixed(2)
  // TODO dedupe from trigger.ts
  await sendNotification({user, title: `You received $${usd} | ${amount} sats`, data, logger})
}


export const sendNotification = async ({user, title, body, data, logger}: INotification) => {

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
    logger.info({message, user}, "test token. skipping notification")
    return
  }

  if (user.deviceToken.length === 0) {
    logger.info({message, user}, "skipping notification as no deviceToken has been registered")
    return
  }

  logger.info({message, user}, "sending notification")

  try {
    const response = await admin.messaging().sendToDevice(
      user.deviceToken,
      message as any,
      {
        // Required for background/quit data-only messages on iOS
        // contentAvailable: true,
        // Required for background/quit data-only messages on Android
        // priority: 'high',
      })

    logger.info({response, user, title, body, data}, 'notification was sent successfully')
  } catch(err) {
    logger.info({err, user, title, body, data}, 'impossible to send notification')
  }

  // FIXME: any as a workaround to https://github.com/Microsoft/TypeScript/issues/15300
}
