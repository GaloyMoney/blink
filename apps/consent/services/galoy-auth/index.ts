import axiosInstance from "./auth-instance";

interface LoginResult {
  authToken: string;
  totpRequired: boolean;
  id: string;
}

const authApi = {
  requestEmailCode: async (email: string): Promise<string> => {
    const result = await axiosInstance.post("/email/code", { email });
    return result.data.result;
  },

  validateTotp: async (totpCode: string, authToken: string): Promise<any> => {
    const response = await axiosInstance.post("/totp/validate", {
      totpCode,
      authToken,
    });
    return response;
  },

  loginWithPhone: async (value: string, code: string): Promise<LoginResult> => {
    const response = await axiosInstance.post("/phone/login", {
      phone: value,
      code,
    });
    return response.data;
  },

  loginWithEmail: async (
    code: string,
    emailLoginId: string
  ): Promise<LoginResult> => {
    const response = await axiosInstance.post("/email/login", {
      code,
      emailLoginId,
    });
    return response.data.result;
  },

  requestPhoneCode: async (
    phone: string,
    challengeCode: string,
    validationCode: string,
    secCode: string
  ): Promise<any> => {
    const response = await axiosInstance.post("/phone/code", {
      phone,
      challengeCode,
      validationCode,
      secCode,
    });

    return response;
  },

  requestPhoneCaptcha: async (): Promise<{
    id: string;
    challengeCode: string;
  }> => {
    const response = await axiosInstance.post("/phone/captcha");
    return response.data.result;
  },
};

export default authApi;
