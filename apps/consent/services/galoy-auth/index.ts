import axiosInstance from "./auth-instance"

interface LoginResult {
  authToken: string
  totpRequired: boolean
  id: string
}

const authApi = {
  requestEmailCode: async (email: string, customHeaders?: object): Promise<string> => {
    const result = await axiosInstance.post(
      "/email/code",
      { email },
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return result.data.result
  },

  validateTotp: async (totpCode: string, authToken: string, customHeaders?: object) => {
    const response = await axiosInstance.post(
      "/totp/validate",
      {
        totpCode,
        authToken,
      },
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return response
  },

  loginWithPhone: async ({
    code,
    phone,
    headers,
    referralAppId,
  }: {
    code: string
    phone: string
    headers?: object
    referralAppId: string
  }): Promise<LoginResult> => {
    const response = await axiosInstance.post(
      "/phone/login",
      {
        phone,
        code,
        referralAppId,
      },
      headers ? { headers } : undefined,
    )
    return response.data
  },

  loginWithEmail: async (
    code: string,
    emailLoginId: string,
    customHeaders?: object,
  ): Promise<LoginResult> => {
    const response = await axiosInstance.post(
      "/email/login",
      {
        code,
        emailLoginId,
      },
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return response.data.result
  },

  requestPhoneCode: async (
    phone: string,
    challengeCode: string,
    validationCode: string,
    secCode: string,
    channel: string,
    customHeaders?: object,
  ) => {
    const response = await axiosInstance.post(
      "/phone/code",
      {
        phone,
        challengeCode,
        validationCode,
        secCode,
        channel,
      },
      customHeaders ? { headers: customHeaders } : undefined,
    )

    return response
  },

  requestPhoneCaptcha: async (
    customHeaders?: object,
  ): Promise<{
    id: string
    challengeCode: string
  }> => {
    const response = await axiosInstance.post(
      "/phone/captcha",
      {},
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return response.data.result
  },
}

export default authApi
