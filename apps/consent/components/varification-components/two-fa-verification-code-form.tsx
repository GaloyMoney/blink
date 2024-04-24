import React from "react"

import InputComponent from "@/components/input-component"
import PrimaryButtonComponent from "@/components/button/primary-button-component"

interface TwoFaVerificationFormProps {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formActionTwoFA: any
  login_challenge: string
  authToken: string
}

const TwoFaVerificationForm: React.FC<TwoFaVerificationFormProps> = ({
  formActionTwoFA,
  login_challenge,
  authToken,
}) => (
  <>
    <h1 id="verification-title" className="text-center mb-4 text-xl font-semibold">
      Please Enter Authenticator Code
    </h1>
    <form action={formActionTwoFA} className="flex flex-col">
      <input type="hidden" name="login_challenge" value={login_challenge} />
      <input type="hidden" name="authToken" value={authToken} />
      <InputComponent
        type="text"
        id="totpCode"
        name="totpCode"
        placeholder="Enter code here"
        autoFocus
      />
      <PrimaryButtonComponent type="submit">Submit</PrimaryButtonComponent>
    </form>
  </>
)

export default TwoFaVerificationForm
