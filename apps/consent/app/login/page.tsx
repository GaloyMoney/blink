import { OAuth2LoginRequest, OAuth2RedirectTo } from "@ory/hydra-client";
import { redirect } from "next/navigation";
import React from "react";
import { hydraClient } from "../../services/hydra";
import InputComponent from "../components/input-component";
import Card from "../components/card";
import MainContent from "../components/main-container";
import Logo from "../components/logo";
import { cookies } from "next/headers";
import Link from "next/link";
import authApi from "@/services/galoy-auth";
import Heading from "../components/heading";
import SubHeading from "../components/sub-heading";
import FormComponent from "../components/form-component";
import Separator from "../components/separator";
import PrimaryButton from "../components/button/primary-button-component";
import SecondaryButton from "../components/button/secondary-button-component";
import { LoginType, SubmitValue } from "../index.types";
import { LoginEmailResponse } from "./email-login.types";
import { headers } from "next/headers";
//  this page is for login via email
interface LoginProps {
  login_challenge: string;
}

async function submitForm(
  formData: FormData
): Promise<LoginEmailResponse | void> {
  "use server";

  const headersList = headers();
  const customHeaders = {
    "x-real-ip": headersList.get("x-real-ip"),
    "x-forwarded-for": headersList.get("x-forwarded-for"),
  };

  const login_challenge = formData.get("login_challenge");
  const submitValue = formData.get("submit");
  const email = formData.get("email");
  const remember = String(formData.get("remember") === "1");
  if (
    !login_challenge ||
    !submitValue ||
    !remember ||
    typeof login_challenge !== "string" ||
    typeof submitValue !== "string"
  ) {
    throw new Error("Invalid Value");
  }

  if (submitValue === SubmitValue.denyAccess) {
    console.log("User denied access");
    const response = await hydraClient.rejectOAuth2LoginRequest({
      loginChallenge: login_challenge,
      rejectOAuth2Request: {
        error: "access_denied",
        error_description: "The resource owner denied the request",
      },
    }, { withCredentials: true });
    redirect(response.data.redirect_to);
  }

  if (!email || typeof email !== "string") {
    console.error("Invalid Values for email");
    throw new Error("Invalid Email Value");
  }

  let emailCodeRequest;
  try {
    emailCodeRequest = await authApi.requestEmailCode(email, customHeaders);
  } catch (err) {
    console.error("error while calling emailRequest Code", err);
  }

  if (!emailCodeRequest) {
    throw new Error("Request failed to get email code");
  }

  // TODO: manage error on ip rate limit
  // TODO: manage error when trying the same email too often

  cookies().set(
    login_challenge,
    JSON.stringify({
      loginType: LoginType.email,
      loginId: emailCodeRequest,
      value: email,
      remember,
    }),
    { secure: true }
  );

  let params = new URLSearchParams({
    login_challenge,
  });
  redirect(`/login/verification?${params}`);
}

const Login = async ({ searchParams }: { searchParams: LoginProps }) => {
  const { login_challenge } = searchParams;
  let body: OAuth2LoginRequest;

  if (!login_challenge) {
    throw new Error("Invalid Request");
  }

  const { data } = await hydraClient.getOAuth2LoginRequest({
    loginChallenge: login_challenge,
  }, { withCredentials: true });

  body = data;
  if (body.skip) {
    let response: OAuth2RedirectTo;
    const { data } = await hydraClient.acceptOAuth2LoginRequest({
      loginChallenge: login_challenge,
      acceptOAuth2LoginRequest: {
        subject: String(body.subject),
      },
    }, { withCredentials: true });
    response = data;
    redirect(String(response.redirect_to));
  }

  return (
    <MainContent>
      <Card>
        <Logo />
        <Heading>Sign In with Blink</Heading>
        <SubHeading>
          Enter your Blink Account ID to sign in to this application.
        </SubHeading>
        <FormComponent action={submitForm}>
          <input type="hidden" name="login_challenge" value={login_challenge} />
          <InputComponent
            data-testid="email_id_input"
            label="Email"
            type="email"
            id="email"
            name="email"
            required
            placeholder="Email Id"
          />
          <div className="flex items-center mb-4">
            <label className="text-gray-700 text-sm flex items-center">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                value="1"
                className="mr-2"
                style={{ width: "14px", height: "14px" }}
              />
              Remember me
            </label>
          </div>
          <Separator>or</Separator>
          <div className="flex justify-center mb-4">
            <div className="text-center text-sm w-60">
              <Link
                data-testid="sign_in_with_phone_text"
                href={`/login/phone?login_challenge=${login_challenge}`}
                replace
              >
                <p className="font-semibold text-sm">Sign in with phone</p>
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row w-full gap-2">
            <SecondaryButton
              type="submit"
              id="reject"
              name="submit"
              value={SubmitValue.denyAccess}
              formNoValidate
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              id="accept"
              name="submit"
              value="Log in"
              data-testid="email_login_next_btn"
            >
              Next
            </PrimaryButton>
          </div>
        </FormComponent>
      </Card>
    </MainContent>
  );
};
export default Login;
