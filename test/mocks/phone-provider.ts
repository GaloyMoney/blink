export const sendTwilioText = async ({ body, to, logger }) => {
  return await new Promise((resolve) => resolve(true))
}

export const sendSMSalaText = async ({ body, to, logger }) => {
  return await new Promise((resolve) => resolve(true))
}

export const getCarrier = async (phone: string) => {
  return await new Promise((resolve) => resolve(null))
}

const getTwilioClient = () => {
  console.log("getTwilioClient")
}
