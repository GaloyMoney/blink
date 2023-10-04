import { OAuth2LoginRequest, OAuth2RedirectTo } from "@ory/hydra-client";
import { redirect } from "next/navigation";
import React from "react";
import { hydraClient } from "@/app/hydra-config";
import axios from "axios";
import { env } from "@/env";
import InputComponent from "@/app/components/input-component";
import Card from "@/app/components/card";
import MainContent from "@/app/components/main-container";
import Logo from "@/app/components/logo";
import ButtonComponent from "@/app/components/button-component";
import { cookies } from "next/headers";
import Link from "next/link";

interface LoginProps {
  login_challenge: string;
}

async function submitForm(formData: FormData) {
  "use server";
  const login_challenge = formData.get("login_challenge");
  const submitValue = formData.get("submit");
  const phone = formData.get("phone");
  const remember = String(formData.get("remember") === "1");
  if (
    !login_challenge ||
    !submitValue ||
    typeof login_challenge !== "string" ||
    typeof submitValue !== "string"
  ) {
    console.error("Invalid Values");
    return;
  }
  if (submitValue === "Deny access") {
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
    console.error("Invalid Values");
    return;
  }

  let phoneLoginId = "phone";
  // const result = await axios.post(`${env.AUTH_URL}/auth/phone/code`, {
  //   phone,
  // });
  // phoneLoginId = result.data.result;

  // TODO: manage error on ip rate limit
  // TODO: manage error when trying the same phone too often

  cookies().set(
    login_challenge,
    JSON.stringify({
      loginType: "phone",
      value: phone,
      remember,
      loginId :  phoneLoginId,
    }),
    { secure: true }
  );

  let params = new URLSearchParams({
    login_challenge,
  });

  redirect(`/login/verification?${params}`);
}

const Login = async ({ searchParams }: { searchParams: LoginProps }) => {
  let body: OAuth2LoginRequest;
  const { login_challenge } = searchParams;

  if (!login_challenge) {
    throw new Error("Invalid Request");
  }

  const { data } = await hydraClient.getOAuth2LoginRequest({
    loginChallenge: login_challenge,
  });

  body = data;
  if (body.skip) {
    let response: OAuth2RedirectTo;
    const { data } = await hydraClient.acceptOAuth2LoginRequest({
      loginChallenge: login_challenge,
      acceptOAuth2LoginRequest: {
        subject: String(body.subject),
      },
    });
    response = data;
    redirect(String(response.redirect_to));
  }

  return (
    <MainContent>
      <Card>
        <Logo />
        <h1 className="text-center mb-4 text-xl font-semibold">
          Sign In with Blink
        </h1>

        <div className="flex justify-center mb-4">
          <div className="text-center text-sm w-60">
            Enter your Phone Number to sign in to this Application.
          </div>
        </div>

        <form action={submitForm} className="flex flex-col">
          <input type="hidden" name="login_challenge" value={login_challenge} />
          <InputComponent
            label="Phone"
            type="tel"
            id="phone"
            name="phone"
            required
            placeholder="Phone Number"
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

          <div className="relative flex items-center justify-center mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center justify-center w-1/2">
              <div className="h-px bg-gray-300 w-full"></div>
            </div>
            <span className="relative z-10 bg-white px-2 text-gray-500 text-sm ">
              or
            </span>
            <div className="absolute inset-y-0 right-0 flex items-center justify-center w-1/2">
              <div className="h-px bg-gray-300 w-full"></div>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <div className="text-center text-sm w-60">
              <Link href={`/login?login_challenge=${login_challenge}`} replace>
                <p className="underline font-semibold text-sm">
                  Sign in with Email
                </p>
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full gap-2">
            <button
              type="submit"
              id="reject"
              name="submit"
              value="Deny access"
              className="flex-1 bg-red-500 text-white p-2 rounded-lg hover:bg-red-700 mb-2 md:mb-0"
            >
              Cancel
            </button>
            <ButtonComponent
              type="submit"
              id="accept"
              name="submit"
              value="Log in"
              className="flex-1 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-700"
            >
              Next
            </ButtonComponent>
          </div>
        </form>
      </Card>
    </MainContent>
  );
};
export default Login;
