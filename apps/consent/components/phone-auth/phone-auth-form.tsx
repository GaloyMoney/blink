"use client"
import React, { useState } from "react"
import Link from "next/link"

import { toast } from "react-toastify"

import PhoneInput from "react-phone-number-input"

import { CountryCode, E164Number } from "libphonenumber-js/types"

import { useFormState } from "react-dom"

import LoginLink from "../login-link"

import { getCaptchaChallenge } from "@/app/login/phone/server-actions"

import PrimaryButton from "@/components/button/primary-button-component"
import SecondaryButton from "@/components/button/secondary-button-component"
import { CaptchaChallenge } from "@/components/captcha-challenge"

import FormComponent from "@/components/form-component"
import Separator from "@/components/separator"

import { SubmitValue } from "@/app/types/index.types"

// eslint-disable-next-line import/no-unassigned-import
import "react-phone-number-input/style.css"
// eslint-disable-next-line import/no-unassigned-import
import "./phone-input-styles.css"

import SelectComponent from "@/components/select"

import RegisterLink from "@/components/register-link"

import { GetCaptchaChallengeResponse } from "@/app/types/phone-auth.types"

interface AuthFormProps {
  authAction: "Register" | "Login"
  login_challenge: string
  countryCodes: Array<CountryCode>
}

const PhoneAuthForm: React.FC<AuthFormProps> = ({
  login_challenge,
  countryCodes,
  authAction,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [state, formAction] = useFormState<GetCaptchaChallengeResponse, FormData>(
    getCaptchaChallenge,
    {
      error: false,
      message: null,
      responsePayload: null,
    },
  )

  if (state.error) {
    toast.error(state.message)
    state.error = false
    state.message = null
    state.responsePayload = null
  }

  const handlePhoneNumberChange = (value?: E164Number | undefined) => {
    if (value) {
      setPhoneNumber(value.toString())
    } else {
      setPhoneNumber("")
    }
  }

  const renderCaptchaChallenge = () => {
    const { responsePayload, message } = state
    if (
      message === "success" &&
      responsePayload &&
      responsePayload.id &&
      responsePayload.challenge &&
      responsePayload.formData &&
      responsePayload.formData.login_challenge &&
      responsePayload.formData.phone &&
      responsePayload.formData.remember !== null &&
      responsePayload.formData.channel
    ) {
      return (
        <CaptchaChallenge
          id={responsePayload.id}
          challenge={responsePayload.challenge}
          formData={{
            login_challenge: responsePayload.formData.login_challenge,
            phone: responsePayload.formData.phone,
            remember: responsePayload.formData.remember.toString(),
            channel: responsePayload.formData.channel,
          }}
        />
      )
    }

    if (message === "success") {
      toast.error("Invalid Captcha Request")
    }

    state.error = false
    state.message = null
    state.responsePayload = null
    return null
  }

  return (
    <>
      {renderCaptchaChallenge()}
      <FormComponent action={formAction}>
        <input type="hidden" name="login_challenge" value={login_challenge} />
        <label
          htmlFor="phone"
          className="block mb-2 text-sm font-medium text-[var(--inputColor)]"
        >
          Phone
        </label>

        <PhoneInput
          international
          countries={countryCodes}
          data-testid="phone_number_input"
          value={phoneNumber}
          required
          placeholder="Phone Number"
          id="phone"
          name="phone"
          onChange={handlePhoneNumberChange}
        />
        <SelectComponent
          id="channel"
          label="Channel"
          name="channel"
          options={["SMS", "WhatsApp"]}
        ></SelectComponent>

        <div className="flex items-center mb-4">
          <label className="text-[var(--inputColor)] text-sm flex items-center">
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

        {authAction === "Register" ? null : (
          <>
            <Separator>or</Separator>
            <div className="flex justify-center mb-4">
              <div className="text-center text-sm w-60">
                <Link href={`/login?login_challenge=${login_challenge}`} replace>
                  <p className="font-semibold text-sm">Sign in with Email</p>
                </Link>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col md:flex-row-reverse w-full gap-2">
          <PrimaryButton
            type="submit"
            id="accept"
            name="submit"
            value="Log in"
            data-testid="phone_login_next_btn"
          >
            Next
          </PrimaryButton>
          <SecondaryButton
            type="submit"
            id="reject"
            name="submit"
            value={SubmitValue.denyAccess}
            formNoValidate
          >
            Cancel
          </SecondaryButton>
        </div>
      </FormComponent>
      {authAction === "Register" ? (
        <LoginLink href={`/login/phone?login_challenge=${login_challenge}`} />
      ) : (
        <RegisterLink href={`/register?login_challenge=${login_challenge}`} />
      )}
    </>
  )
}

export default PhoneAuthForm
