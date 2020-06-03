const twilioPhoneNumber = "***REMOVED***"
import { createPhoneCode, createUser } from "./db"
import moment from "moment"
import * as jwt from 'jsonwebtoken'
import { JWT_SECRET } from "./const"

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

const TEST_NUMBER = [{phone: "+16505554321", code: 321321}]

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

const createToken = ({uid, network}) => jwt.sign({ uid, network }, JWT_SECRET, {
    algorithm: 'HS256',
})

export const login = async ({phone, code, network}) => {
    // TODO assert network == process.env.network

    try {
        const PhoneCode = await createPhoneCode()
        const codes = await PhoneCode.find({
            phone,
            created_at: {
                $gte: moment().subtract(20, "minutes"),
            }
        })

        let test_account = false

        // make it possible to bypass the auth for testing purpose
        if (TEST_NUMBER.findIndex(item => item.phone === phone) !== -1) {
            if (TEST_NUMBER.filter(item => item.phone === phone)[0].code === code) {
                test_account = true
            }
        }

        if (!test_account && codes.findIndex(item => item.code === code) === -1) {
            return null
        }

        // code is correct
        const User = await createUser()

        // get User 
        const user = await User.findOneAndUpdate({phone}, {level: 1}, {upsert: true})

        return createToken({uid: user._id, network})
    } catch (err) {
        console.error(err)
        throw err
    }
}
