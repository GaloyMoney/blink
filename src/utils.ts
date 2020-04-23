import * as functions from 'firebase-functions'
const lnService = require('ln-service')
import * as moment from 'moment'


/**
 * @param lnd 
 * @param partner_public_key 
 * @returns array of channels
 */
export const channelsWithPubkey = async (lnd: any, partner_public_key: string): Promise<Array<Object>> => {
    // only send when first channel is being opened
    const { channels } = await lnService.getChannels({lnd})
    return channels.filter((item: any) => item.partner_public_key === partner_public_key)
}

export const btc2sat = (btc: number) => {
    return btc * Math.pow(10, 8)
}

export const sat2btc = (sat: number) => {
    return sat / Math.pow(10, 8)
}


export const checkAuth = (context: any) => { // FIXME any
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 
            'The function must be called while authenticated.')
    }
}

export const checkNonAnonymous = (context: any) => { // FIXME any
    checkAuth(context)

    if (context.auth.token.provider_id === "anonymous") {
        throw new functions.https.HttpsError('failed-precondition', 
            `This function must be while authenticate and not anonymous`)
    }
}

export const checkBankingEnabled = checkNonAnonymous // TODO


export const validate = require("validate.js")

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
