export const TwilioClient = () => {
  const sendText = async () => {
    return new Promise((resolve) => resolve(true))
  }

  const getCarrier = async () => {
    return new Promise((resolve) => resolve(null))
  }

  return { sendText, getCarrier }
}
