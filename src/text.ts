const twilioPhoneNumber = "***REMOVED***"
import moment from "moment"
const mongoose = require("mongoose");

import { randomIntFromInterval, createToken } from "./utils"

const getTwilioClient = () => {
    const accountSID = "***REMOVED***"
    const authToken = "***REMOVED***"
    
    const client = require('twilio')(
        accountSID,
        authToken
    )

    return client
}

const sendText = async ({body, to}) => {
    await getTwilioClient().messages.create({
        from: twilioPhoneNumber,
        to,
        body,
    })
}

export const TEST_NUMBER = [{phone: "+16505554321", code: 321321},{phone: "+16505554322", code: 321321}]

export const requestPhoneCode = async ({phone}) => {

    // make it possible to bypass the auth for testing purpose
    if (TEST_NUMBER.findIndex(item => item.phone === phone) !== -1) {
        return true
    }

    const code = randomIntFromInterval(100000, 999999)
    const body = `${code} is your verification code for Galoy`

    try {
        // TODO: only one code per 30 seconds should be generated.
        // otherwise an attack would be to call this enough time
        // in a row and ultimately randomly find a code

        const PhoneCode = mongoose.model("PhoneCode")
        await PhoneCode.create({phone, code})

        await sendText({body, to: phone})
    } catch (err) {
        console.error(err)
        return false
    }

    return true
}

export const login = async ({phone, code, network}) => {
    // TODO assert network == process.env.network

    try {
        const PhoneCode = mongoose.model("PhoneCode")
        const codes = await PhoneCode.find({
            phone,
            created_at: {
                $gte: moment().subtract(20, "minutes"),
            }
        })

        let test_account = false

        // is it a test account?
        if (TEST_NUMBER.findIndex(item => item.phone === phone) !== -1 &&
            TEST_NUMBER.filter(item => item.phone === phone)[0].code === code) {
            test_account = true
        // return null is the code is not correct
        } else if(codes.findIndex(item => item.code === code) === -1) {
            console.warn(`code is not correct: ${code} with ${phone}`)
            return null
        }

        // code is correct
        const User = mongoose.model("User")

        // get User 
        const user = await User.findOneAndUpdate({phone}, {level: 1}, {upsert: true, new: true})

        return createToken({uid: user._id, network})
    } catch (err) {
        console.error(err)
        throw err
    }
}
