"use server";
import authApi from "@/services/galoy-auth";
import axios from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GetCaptchaChallengeResponse,
  SendPhoneCodeResponse,
} from "./phone-login.types";
import { LoginType, SubmitValue } from "@/app/index.types";
import { isValidPhoneNumber } from "libphonenumber-js";
import { hydraClient } from "@/services/hydra";


export const getCaptchaChallenge = async (
  _prevState: unknown,
  form: FormData
): Promise<GetCaptchaChallengeResponse> => {
  let phone = form.get("phone");
  const login_challenge = form.get("login_challenge");
  const remember = form.get("remember") === "1";
  const submitValue = form.get("submit");


  if (!submitValue || !login_challenge || typeof login_challenge !== "string") {
    throw new Error("submitValue not provided");
  }

  if (submitValue === SubmitValue.denyAccess) {
    console.log("User denied access");
    const response = await hydraClient.rejectOAuth2LoginRequest({
      loginChallenge: login_challenge,
      rejectOAuth2Request: {
        error: "access_denied",
        error_description: "The resource owner denied the request",
      },
    });
    redirect(response.data.redirect_to);
  }

  if (!phone || typeof phone !== "string") {
    throw new Error("Phone not provided");
  }

  phone = phone.replace(/\s+/g, "");
  if (!isValidPhoneNumber(phone)) {
    return {
      error: true,
      message: "Invalid Phone number",
      responsePayload: {
        id: null,
        challenge: null,
        formData: {
          login_challenge,
          phone,
          remember,
        },
      },
    };
  }

  const res = await authApi.requestPhoneCaptcha();
  const id = res.id;
  const challenge = res.challengeCode;
  return {
    error: false,
    message: "success",
    responsePayload: {
      id,
      challenge,
      formData: {
        login_challenge,
        phone,
        remember,
      },
    },
  };
};

export const sendPhoneCode = async (
  result: {
    geetest_challenge: string;
    geetest_validate: string;
    geetest_seccode: string;
  },
  formData: {
    login_challenge: string;
    phone: string;
    remember: string;
  }
): Promise<SendPhoneCodeResponse> => {
  const login_challenge = formData.login_challenge;
  const phone = formData.phone;
  const remember = String(formData.remember) === "true";

  let res;
  try {
    res = await authApi.requestPhoneCode(
      phone,
      result.geetest_challenge,
      result.geetest_validate,
      result.geetest_seccode
    );
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      console.error("Error in 'phone/code' action", err.response.data);
      return {
        error: true,
        message: err.response.data.error || "An unknown error occurred",
        responsePayload: null,
      };
    } else {
      console.error("An unknown error occurred", err);
      return {
        error: true,
        message: "An unknown error occurred",
        responsePayload: null,
      };
    }
  }

  if (res?.data?.success !== true) {
    console.error("Unexpected status code in 'phone/code' action:", res.status);
    return {
      error: true,
      message: "An unknown error occurred",
      responsePayload: null,
    };
  }

  cookies().set(
    login_challenge,
    JSON.stringify({
      loginType: LoginType.phone,
      value: phone,
      remember: remember,
    }),
    { secure: true }
  );

  let params = new URLSearchParams({
    login_challenge,
  });

  redirect(`/login/verification?${params}`);
};
