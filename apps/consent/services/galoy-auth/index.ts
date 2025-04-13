import axiosInstance from "./auth-instance"

interface LoginResult {
  authToken: string
  totpRequired: boolean
  id: string
}

const authApi = {
  requestEmailCode: async ({
    email,
    customHeaders,
  }: {
    email: string
    customHeaders?: object
  }): Promise<string> => {
    const result = await axiosInstance.post(
      "/email/code",
      { email },
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return result.data.result
  },

  validateTotp: async ({
    totpCode,
    authToken,
    customHeaders,
  }: {
    totpCode: string
    authToken: string
    customHeaders?: object
  }) => {
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
    value,
    code,
    customHeaders,
  }: {
    value: string
    code: string
    customHeaders?: object
  }): Promise<LoginResult> => {
    const response = await axiosInstance.post(
      "/phone/login",
      {
        phone: value,
        code,
      },
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return response.data
  },

  loginWithEmail: async ({
    code,
    emailLoginId,
    customHeaders,
  }: {
    code: string
    emailLoginId: string
    customHeaders?: object
  }): Promise<LoginResult> => {
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

  requestPhoneCode: async ({
    phone,
    challengeCode,
    validationCode,
    secCode,
    channel,
    customHeaders,
  }: {
    phone: string
    challengeCode: string
    validationCode: string
    secCode: string
    channel: string
    customHeaders?: object
  }) => {
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

  requestPhoneCaptcha: async ({
    customHeaders,
  }: {
    customHeaders?: object
  }): Promise<{ id: string; challengeCode: string }> => {
    const response = await axiosInstance.post(
      "/phone/captcha",
      {},
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return response.data.result
  },

  // Telegram Passport APIs
  requestTelegramPassportNonce: async ({
    phone,
    customHeaders,
  }: {
    phone: string
    customHeaders?: object
  }): Promise<{
    bot_id: number
    scope: {
      data: string[]
      v: number
    }
    public_key: string
    nonce: string
    callback_url?: string
  }> => {
    const response = await axiosInstance.post(
      "/telegram-passport/nonce",
      { phone },
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return response.data
  },

  loginWithTelegramPassport: async ({
    nonce,
    phone,
    customHeaders,
  }: {
    nonce: string
    phone: string
    customHeaders?: object
  }): Promise<LoginResult> => {
    const response = await axiosInstance.post(
      "/telegram-passport/login",
      { nonce, phone },
      customHeaders ? { headers: customHeaders } : undefined,
    )
    return response.data
  },
}

export default authApi
