"use server";
import MainContent from "@/app/components/main-container";
import Card from "@/app/components/card";
import Logo from "@/app/components/logo";
import { redirect } from "next/navigation";
import { hydraClient } from "@/app/hydra-config";
import { oidcConformityMaybeFakeAcr } from "@/app/oidc-cert";
import VerificationForm from "./verification-form";
import { cookies } from "next/headers";
import axios from "axios";
import { env } from "@/env";
import { CaptchaChallenge } from "@/app/components/captcha-challenge/indext";

interface VerificationProps {
  login_challenge: string;
  email: string;
  loginId: string;
  remember: string;
}

export const submitForm = async (_prevState: unknown, form: FormData) => {
  const login_challenge = form.get("login_challenge");
  const code = form.get("code");
  const remember = form.get("remember") === "true";
  const loginId = form.get("loginId");

  if (
    !login_challenge ||
    !code ||
    typeof login_challenge !== "string" ||
    typeof code !== "string"
  ) {
    console.error("Invalid Params");
    return;
  }

  let authToken;
  let totpRequired;
  let userId;
  const res2 = await axios.post(`${env.AUTH_URL}/auth/email/login`, {
    code,
    loginId,
  });
  authToken = res2.data.result.authToken;
  totpRequired = res2.data.result.totpRequired;
  userId = res2.data.result.id;

  if (!authToken) {
    return {
      message: "Invalid code",
    };
  }

  let response2;
  const response = await hydraClient.getOAuth2LoginRequest({
    loginChallenge: login_challenge,
  });
  const loginRequest = response.data;

  response2 = await hydraClient.acceptOAuth2LoginRequest({
    loginChallenge: login_challenge,
    acceptOAuth2LoginRequest: {
      subject: userId,
      remember: remember,
      remember_for: 3600,
      acr: oidcConformityMaybeFakeAcr(loginRequest, "0"),
    },
  });

  redirect(response2.data.redirect_to);
};

const Verification = ({
  searchParams,
}: {
  searchParams: VerificationProps;
}) => {
  const { login_challenge } = searchParams;
  const cookieStore = cookies().get(login_challenge);

  if (!cookieStore) {
    throw new Error("Cannot find cookies");
  }

  const { loginType, value, remember, loginId } = JSON.parse(cookieStore.value);
  if (!login_challenge || !value || !loginId || !loginType) {
    throw new Error("Invalid Request");
  }

  return (
    <MainContent>
      {/* <div id="captcha"></div> */}
      {/* <CaptchaChallenge phoneNumber="+918319306878"></CaptchaChallenge> */}
      <Card>
        <Logo />
        <h1
          id="verification-title"
          className="text-center mb-4 text-xl font-semibold"
        >
          Enter Verification Code
        </h1>
        <VerificationForm
          login_challenge={login_challenge}
          loginId={loginId}
          loginType={loginType}
          value={value}
          remember={remember}
          submitForm={submitForm}
        />
      </Card>
    </MainContent>
  );
};

export default Verification;
