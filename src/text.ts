const twilioPhoneNumber = "***REMOVED***"
import { createPhoneCode } from "./db"
import moment from "moment"
import * as jwt from 'jsonwebtoken'


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

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

const TEST_NUMBER = [{phone: "6505554321", code: 321321}]

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

        const PhoneCode = await createPhoneCode()
        await PhoneCode.create({phone, code})

        await sendText({body, to: phone})
    } catch (err) {
        console.error(err)
        return false
    }

    return true
}

const createToken = ({id}) => jwt.sign({ sub: id }, 'secret', {
    algorithm: 'HS256',
})

export const login = async ({phone, code}) => {

    // make it possible to bypass the auth for testing purpose
    if (TEST_NUMBER.findIndex(item => item.phone === phone) !== -1) {
        if (TEST_NUMBER.filter(item => item.phone === phone)[0].code === code) {
            return createToken({id: phone})
        }
    }

    try {
        const PhoneCode = await createPhoneCode()
        const codes = await PhoneCode.find({
            phone,
            created_at: {
                $gte: moment().subtract(20, "minutes"),
            }
        })

        if (codes.findIndex(item => item.code === code) === -1) {
            return false
        }

        // TODO manage id properly
        return createToken({id: phone})
    } catch (err) {
        console.error(err)
        throw err
    }
}
