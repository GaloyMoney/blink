"use client"
import React, { useState } from "react"

import { toast } from "react-toastify"

import PhoneInput from "react-phone-number-input"

import { CountryCode, E164Number } from "libphonenumber-js/types"

import { useFormState } from "react-dom"

import LoginLink from "../login-link"

import SignInTab from "../tab/sign-in-tabs"

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
import { SupportedCountry } from "@/app/graphql/queries/get-supported-countries"

interface AuthFormProps {
  authAction: "Register" | "Login"
  login_challenge: string
  countries: Array<SupportedCountry>
}

const PhoneAuthForm: React.FC<AuthFormProps> = ({
  login_challenge,
  countries,
  authAction,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | undefined>()
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

  const getAvailableChannels = (selectedCountry: CountryCode | undefined) => {
    const country = countries.find((c) => c.id === selectedCountry)
    return country?.supportedAuthChannels.map((c) => c) || ["SMS"]
  }

  const countryCodes: CountryCode[] = countries.map(
    (country) => country.id as CountryCode,
  )
  return (
    <>
      {renderCaptchaChallenge()}
      <FormComponent action={formAction}>
        <input type="hidden" name="login_challenge" value={login_challenge} />
        {authAction !== "Register" && <SignInTab login_challenge={login_challenge} />}
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
          onCountryChange={setSelectedCountry}
        />
        {selectedCountry && (
          <SelectComponent
            id="channel"
            name="channel"
            data-testid="phone_number_channel_select"
            defaultValue="SMS"
            options={getAvailableChannels(selectedCountry)}
            required
          ></SelectComponent>
        )}
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
        <div className="flex flex-col md:flex-row-reverse w-full gap-2 mb-6">
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
        <>
          <Separator>or</Separator>
          <div className="m-5">
            <LoginLink href={`/login/phone?login_challenge=${login_challenge}`} />
          </div>
        </>
      ) : (
        <>
          <Separator>or</Separator>
          <div className="m-5">
            <RegisterLink href={`/register?login_challenge=${login_challenge}`} />
          </div>
        </>
      )}
    </>
  )
}

export default PhoneAuthForm
