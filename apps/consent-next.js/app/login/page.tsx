import { OAuth2LoginRequest, OAuth2RedirectTo } from "@ory/hydra-client";
import { redirect } from "next/navigation";
import React from "react";
import { hydraClient } from "../hydra-config";
import axios from "axios";
import { authUrl } from "@/env";

interface LoginProps {
  login_challenge: string;
}

async function submitForm(formData: FormData) {
  "use server";
  const login_challenge = formData.get("login_challenge");
  const submitValue = formData.get("submit");
  const email = formData.get("email");
  const remember = String(formData.get("remember") === "1");
  if (
    typeof login_challenge === "string" &&
    typeof submitValue === "string" &&
    login_challenge &&
    submitValue
  ) {
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

    if (typeof email === "string" && email) {
      let emailLoginId: string = "test";
      try {
        // const result = await axios.post(`${authUrl}/auth/email/code`, {
        //   email,
        // });
        // emailLoginId = result.data.result;
      } catch (err) {
        console.error("error in getting emailLoginId", err);
        return;
      }
      let params = new URLSearchParams({
        remember,
        login_challenge,
        email,
        emailLoginId,
      });
      redirect(`/login/verification?${params}`);
    }
  }
}

const Login = async ({ searchParams }: { searchParams: LoginProps }) => {
  let body: OAuth2LoginRequest;
  const { login_challenge } = searchParams;

  if (!login_challenge) {
    return <p>INVALID REQUEST</p>;
  }

  try {
    const { data } = await hydraClient.getOAuth2LoginRequest({
      loginChallenge: login_challenge,
    });
    body = data;
  } catch (err) {
    console.error("error in getOAuth2LoginRequest", err);
    return;
  }

  if (body.skip) {
    let response: OAuth2RedirectTo;
    try {
      const { data } = await hydraClient.acceptOAuth2LoginRequest({
        loginChallenge: login_challenge,
        acceptOAuth2LoginRequest: {
          subject: String(body.subject),
        },
      });
      response = data;
    } catch (err) {
      console.error("error in acceptOAuth2LoginRequest", err);
      return;
    }
    redirect(String(response.redirect_to));
  }

  return (
    <main>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-lg shadow-lg w-1/3">
          <form action={submitForm} className="flex flex-col">
            <input
              type="hidden"
              name="login_challenge"
              value={login_challenge}
            />
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email Id"
              className="p-2 mb-4 border rounded"
            />
            <div className="flex items-center mb-4">
              <label className="text-gray-700 flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  value="1"
                  className="mr-2"
                />
                Remember me
              </label>
            </div>
            <div className="flex flex-col w-full">
              {" "}
              <button
                type="submit"
                id="accept"
                name="submit"
                value="Log in"
                className="mb-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-full"
              >
                Log in
              </button>
              <button
                type="submit"
                id="reject"
                name="submit"
                value="Deny access"
                className="bg-red-500 text-white p-2 rounded hover:bg-red-700 w-full"
              >
                Deny access
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;
