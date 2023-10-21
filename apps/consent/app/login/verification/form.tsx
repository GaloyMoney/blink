"use client"
import React from "react"
/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line error
import { experimental_useFormState as useFormState } from "react-dom"

import { toast } from "react-toastify"

import TwoFaVerificationForm from "../../components/varification-components/two-fa-verification-code-form"
import VerificationCodeForm from "../../components/varification-components/verification-code-form"

import { submitFormTotp, submitForm } from "./server-actions"

interface VerificationFormProps {
  login_challenge: string
  loginId: string
  remember: string
  loginType: string
  value: string
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  login_challenge,
  loginId,
  remember,
  loginType,
  value,
}) => {
  const [stateVerificationCode, formActionVerificationCode] = useFormState(submitForm, {
    totpRequired: false,
    message: null,
    authToken: null,
  })

  const [stateTwoFA, formActionTwoFA] = useFormState(submitFormTotp, {
    error: false,
    message: null,
  })

  if (stateVerificationCode.error) {
    toast.error(stateVerificationCode.message)
  }

  if (stateTwoFA.error) {
    toast.error(stateTwoFA.message)
  }

  return (
    <>
      {stateVerificationCode.totpRequired ? (
        <TwoFaVerificationForm
          formActionTwoFA={formActionTwoFA}
          login_challenge={login_challenge}
          authToken={stateVerificationCode.authToken}
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
