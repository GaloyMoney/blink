// import { baseLogger } from "../logger"
// import { sendTwilioText, sendSMSalaText } from "../text"

// const phone = "add phone number here with extension (ie: +1...)"

const main = async () => {
  try {
    // await sendTwilioText({body: "test text", to: phone, logger: baseLogger})
  } catch (err) {
    fail("there was an error sending the Twilio text")
  }

  try {
    // await sendSMSalaText({ body: "test text", to: phone, logger: baseLogger })
  } catch (err) {
    fail("there was an error sending the SMSala text")
  }
}

main()
  .then((o) => console.log(o))
  .catch((err) => console.log(err))

// Get carrier response sample
// {
//   callerName: null,
//   countryCode: "US",
//   phoneNumber: "+1650555000",
//   nationalFormat: "(650) 555-0000",
//   carrier: {
//     mobile_country_code: "123",
//     mobile_network_code: "123",
//     name: "carrier",
//     type: "voip",
//     error_code: null,
//   },
//   addOns: null,
//   url: "https://lookups.twilio.com/v1/PhoneNumbers/+1650555000?Type=carrier",
// }
