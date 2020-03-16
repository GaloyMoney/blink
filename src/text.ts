const twilioPhoneNumber = "***REMOVED***"

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
