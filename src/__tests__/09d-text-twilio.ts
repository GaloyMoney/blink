import { setupMongoConnection } from "../mongodb"
import { User } from "../schema"
import { baseLogger } from "../logger"
import mongoose from "mongoose"

const resp = {
  callerName: null,
  countryCode: "US",
  phoneNumber: "+1650555000",
  nationalFormat: "(650) 555-0000",
  carrier: {
    mobile_country_code: "123",
    mobile_network_code: "123",
    name: "carrier",
    type: "voip",
    error_code: null,
  },
  addOns: null,
  url: "https://lookups.twilio.com/v1/PhoneNumbers/+1650555000?Type=carrier",
}

beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
  await mongoose.connection.close()
})

// const phone = "add phone number here with extension (ie: +1...)"

it("test sending text. not run as part of the continuous integration", async () => {
  // uncomment to run the test locally

  try {
    // await sendText({body: "test text", to: phone})
  } catch (err) {
    fail("there was an error sending the text")
  }

  expect(true).toBe(true)
})

it("test fetching carrier and adding this info to User", async () => {
  const getCarrier = () =>
    new Promise(function (resolve) {
      resolve(resp)
    })

  try {
    const phone = "+1650555000"
    const result = await getCarrier()

    const user = await User.findOneAndUpdate({ phone }, {}, { upsert: true, new: true })
    // console.log({twilio: user.twilio})
    expect(user.twilio.countryCode === undefined).toBeTruthy()

    user.twilio = result

    baseLogger.info({ user })

    await user.save()
    expect(user.twilio.countryCode === undefined).toBeFalsy()
  } catch (err) {
    console.error({ err }, "error fetching carrier info")
    fail("there was an error fetching carrier info")
  }
})
