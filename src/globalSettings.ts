import * as functions from 'firebase-functions'
import { initLnd } from "./lightning"
const lnService = require('ln-service')
import * as admin from 'firebase-admin'
const firestore = admin.firestore()


exports.setGlobalInfo = functions.https.onCall(async (data, context) => {
  const lnd = initLnd()
  const wallet = await lnService.getWalletInfo({lnd});

  return firestore.doc(`/global/info`).set({
      lightning: {
          pubkey: wallet.public_key,
          host: functions.config().lnd[functions.config().lnd.network].lndaddr
  }})
})
