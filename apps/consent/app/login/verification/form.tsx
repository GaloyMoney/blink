"use client"
import React from "react"

import { useFormState } from "react-dom"

import { toast } from "react-toastify"

import TwoFaVerificationForm from "../../../components/varification-components/two-fa-verification-code-form"
import VerificationCodeForm from "../../../components/varification-components/verification-code-form"

import { submitFormTotp, submitForm } from "./server-actions"
import { VerificationCodeResponse, VerificationTotpResponse } from "./verification.types"

interface VerificationFormProps {
  login_challenge: string
  loginId: string
  remember: string
  loginType: string
  value: string
  authToken?: string
  totpRequired?: boolean
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  login_challenge,
  loginId,
  remember,
  loginType,
  value,
  authToken,
  totpRequired,
}) => {
  const [stateVerificationCode, formActionVerificationCode] = useFormState<
    VerificationCodeResponse,
    FormData
  >(submitForm, {
    error: false,
    message: null,
    responsePayload: null,
  })

  const [stateTwoFA, formActionTwoFA] = useFormState<VerificationTotpResponse, FormData>(
    submitFormTotp,
    {
      error: false,
      message: null,
      responsePayload: null,
    },
  )

  if (stateVerificationCode.error) {
    toast.error(stateVerificationCode.message)
    stateVerificationCode.error = false
    stateVerificationCode.message = null
    stateVerificationCode.responsePayload = null
  }

  if (stateTwoFA.error) {
    toast.error(stateTwoFA.message)
    stateTwoFA.error = false
    stateTwoFA.message = null
    stateTwoFA.responsePayload = null
  }

  const isTotpRequired =
    totpRequired || stateVerificationCode?.responsePayload?.totpRequired
  const token = authToken || stateVerificationCode?.responsePayload?.authToken

  return (
    <>
      {isTotpRequired && token ? (
        <TwoFaVerificationForm
          formActionTwoFA={formActionTwoFA}
          login_challenge={login_challenge}
          authToken={token}
        />
      ) : (
        <VerificationCodeForm
          formAction={formActionVerificationCode}
          login_challenge={login_challenge}
          loginId={loginId}
          remember={remember}
          loginType={loginType}
          value={value}
        />
      )}
    </>
  )
}

export default VerificationForm
