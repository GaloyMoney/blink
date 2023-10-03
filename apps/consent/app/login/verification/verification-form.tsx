"use client"
import React from "react";
// @ts-ignore-next-line no-implicit-any error
import { experimental_useFormState as useFormState } from "react-dom";
import InputComponent from "@/app/components/input-component";
import ButtonComponent from "@/app/components/button-component";

interface VerificationFormProps {
  login_challenge: string;
  email: string;
  emailLoginId: string;
  remember: string;
  submitForm: (
    _prevState: unknown,
    form: FormData
  ) => Promise<{ message: string } | undefined>;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  login_challenge,
  email,
  emailLoginId,
  remember,
  submitForm,
}) => {
  const [state, formAction] = useFormState(submitForm, {
    message: null,
  });

  return (
    <form action={formAction} className="flex flex-col">
      <input type="hidden" name="login_challenge" value={login_challenge} />
      <input type="hidden" name="emailLoginId" value={emailLoginId} />
      <input type="hidden" name="remember" value={remember} />

      <div className="flex flex-col items-center mb-4">
        <p className="text-center text-sm w-60 mb-1">
          The code was sent to your email{" "}
        </p>
        <span className="font-semibold">{email}</span>
      </div>

      {state?.message ? (
        <>
          <p className="mb-4 text-red-700 text-center">
            <span className="font-semibold">{state?.message}</span>.
          </p>
        </>
      ) : null}

      <InputComponent
        type="text"
        id="code"
        name="code"
        placeholder="Enter code here"
      />
      <ButtonComponent type="submit">Submit</ButtonComponent>
    </form>
  );
};

export default VerificationForm;
