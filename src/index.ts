import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

// FIXME: figure out the way to do Just in time initializing with firebase
// Line below is needed before loading other file that may invoque admin.firestore()
// in the header
admin.initializeApp()
const firestore = admin.firestore()

import * as moment from 'moment'
import { initLnd } from "./lightning"



const validate = require("validate.js")
const lnService = require('ln-service')

// we are extending validate so that we can validate dates
// which are not supported date by default
validate.extend(validate.validators.datetime, {
    // The value is guaranteed not to be null or undefined but otherwise it
    // could be anything.
    parse: function(value: any, options: any) {
        return +moment.utc(value);
    },
    // Input is a unix timestamp
    format: function(value: any, options: any) {
        const format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD hh:mm:ss";
        return moment.utc(value).format(format);
    }
})

module.exports = {
    ...require("./fiat.ts"),
    ...require("./exchange.ts"),
    ...require("./lightning.ts"),
    ...require("./user.ts"),
}



exports.setGlobalInfo = functions.https.onCall(async (data, context) => {
    const lnd = initLnd()
    const wallet = await lnService.getWalletInfo({lnd});

    return firestore.doc(`/global/info`).set({
        lightning: {
            pubkey: wallet.public_key,
            host: functions.config().lnd[functions.config().lnd.network].lndaddr
    }})
})
