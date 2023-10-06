import { yamlConfig } from "@/config"

export const TwilioClient = () => {
  const initiateVerify = async () => {
    return new Promise((resolve) => resolve(true))
  }

  const validateVerify = async () => {
    return new Promise((resolve) => resolve(true))
  }

  const getCarrier = async (phone: PhoneNumber) => {
    const entry = yamlConfig.test_accounts.find((item) => item.phone === phone)

    return new Promise((resolve) => {
      if (!entry) return resolve(null)

      return resolve({
        carrier: {
          type: "mobile" as CarrierType,
          name: "",
          mobile_network_code: "",
          mobile_country_code: "",
          error_code: "",
        },
        countryCode: "US",
      })
    })
  }

  return { initiateVerify, validateVerify, getCarrier }
}
