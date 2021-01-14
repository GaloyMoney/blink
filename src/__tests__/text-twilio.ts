import { sendText } from "../text"

const phone = "add phone number here with extension (ie: +1...)"

it('test sending text. not run as part of the continuous integration', async () => {
  // uncomment to run the test locally

  try {
    // await sendText({body: "test text", to: phone})
  } catch (err) {
    fail('there was an error sending the text');
  }

  expect(true).toBe(true)
})
