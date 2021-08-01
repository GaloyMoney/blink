import * as admin from "firebase-admin"
import _ from "lodash"

// The key GOOGLE_APPLICATION_CREDENTIALS should be set in production
// This key defined the path of the config file that include the key
// more info at https://firebase.google.com/docs/admin/setup
// TODO: mock up the function for devnet
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}

export const sendNotification = async ({
  title,
  user,
  body,
  data,
  logger,
}: INotification) => {
  // TODO: Figure out the unknown type here
  const message: Record<string, Record<string, unknown>> = {
    // only string can be sent to notifications
    data: {
      ..._.mapValues(data, (v) => String(v)),
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
    message["notification"]["body"] = body
  }

  if (user.deviceToken.length === 1 && user.deviceToken[0] === "test") {
    logger.info({ message, user }, "test token. skipping notification")
    return
  }

  if (user.deviceToken.length === 0) {
    logger.info(
      { message, user },
      "skipping notification as no deviceToken has been registered",
    )
    return
  }

  logger.info({ message, user }, "sending notification")

  try {
    const response = await admin.messaging().sendToDevice(
      user.deviceToken.filter((token) => token.length === 163),
      message,
      {
        // Required for background/quit data-only messages on iOS
        // contentAvailable: true,
        // Required for background/quit data-only messages on Android
        // priority: 'high',
      },
    )

    logger.info(
      { response, user, title, body, data },
      "notification was sent successfully",
    )
  } catch (err) {
    logger.info({ err, user, title, body, data }, "impossible to send notification")
  }

  // FIXME: any as a workaround to https://github.com/Microsoft/TypeScript/issues/15300
}
