"use client"
import React, { useState } from "react"
import Link from "next/link"

import { toast } from "react-toastify"

/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line error
import { experimental_useFormState as useFormState } from "react-dom"

import PhoneInput from "react-phone-number-input"

import { E164Number } from "libphonenumber-js/types"

import { getCaptchaChallenge } from "./server-actions"

import { GetCaptchaChallengeResponse } from "./phone-login.types"

import PrimaryButton from "@/app/components/button/primary-button-component"
import SecondaryButton from "@/app/components/button/secondary-button-component"
import { CaptchaChallenge } from "@/app/components/captcha-challenge"

import FormComponent from "@/app/components/form-component"
import Separator from "@/app/components/separator"

import { SubmitValue } from "@/app/index.types"
// eslint-disable-next-line import/no-unassigned-import
import "react-phone-number-input/style.css"
// eslint-disable-next-line import/no-unassigned-import
import "./phone-input-styles.css"

interface LoginFormProps {
  login_challenge: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countryCodes: any
}

// TODO need to add country call codes
const LoginForm: React.FC<LoginFormProps> = ({ login_challenge, countryCodes }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  //TODO useFormState is not giving type suggestions/errors i.e: not typed
  const [state, formAction] = useFormState<GetCaptchaChallengeResponse>(
    getCaptchaChallenge,
    {
      error: null,
      message: null,
      responsePayload: {
        id: null,
        challenge: null,
        formData: {
          login_challenge: null,
          phone: null,
          remember: null,
        },
      },
    },
  )

  if (state.error) {
    toast.error(state.message)
    state.error = null
  }

  const handlePhoneNumberChange = (value?: E164Number | undefined) => {
    if (value) {
      setPhoneNumber(value.toString())
    } else {
      setPhoneNumber("")
    }
  }

  return (
    <>
      {state.message === "success" ? (
        <CaptchaChallenge
          id={state.responsePayload.id}
          challenge={state.responsePayload.challenge}
          formData={state.responsePayload.formData}
        />
      ) : null}
      <FormComponent action={formAction}>
        <input type="hidden" name="login_challenge" value={login_challenge} />
        <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900">
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
            <Link href={`/login?login_challenge=${login_challenge}`} replace>
              <p className="font-semibold text-sm">Sign in with Email</p>
            </Link>
          </div>
        </div>

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
    </>
  )
}

export default LoginForm
