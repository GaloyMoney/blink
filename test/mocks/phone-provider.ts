export const sendTwilioText = async ({ body, to, logger }) => {
  return await new Promise((resolve) => resolve(true))
}

export const sendSMSalaText = async ({ body, to, logger }) => {
  return await new Promise((resolve) => resolve(true))
}

const getTwilioClient = () => {
  console.log("getTwilioClient")
}
