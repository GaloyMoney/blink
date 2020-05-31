const lnService = require('ln-service')
import * as moment from 'moment'


export const btc2sat = (btc: number) => {
    return btc * Math.pow(10, 8)
}

export const sat2btc = (sat: number) => {
    return sat / Math.pow(10, 8)
}


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

export const shortenHash = (hash: string, length = 4) => {
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`
}