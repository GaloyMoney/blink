"use server"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { revalidatePath } from "next/cache"

import { AddEmailResponse, VerifyEmailResponse } from "./email.types"

import {
  deleteEmail,
  emailRegistrationInitiate,
  emailRegistrationValidate,
} from "@/services/graphql/mutations/email"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

import {
  UserEmailRegistrationInitiateMutation,
  UserEmailRegistrationValidateMutation,
} from "@/services/graphql/generated"

export const emailRegisterInitiateServerAction = async (
  _prevState: AddEmailResponse,
  form: FormData,
): Promise<AddEmailResponse> => {
  const email = form.get("email")
  if (!email || typeof email !== "string") {
    return {
      error: true,
      message: "Invalid Email",
      responsePayload: null,
    }
  }

  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token && typeof token !== "string") {
    return {
      error: true,
      message: "Invalid Token",
      responsePayload: null,
    }
  }

  let data: UserEmailRegistrationInitiateMutation | null | undefined
  try {
    data = await emailRegistrationInitiate({ email })
  } catch (err) {
    console.log("error in emailRegistrationInitiate ", err)
    return {
      error: true,
      message:
        "Something went wrong Please try again and if error persist contact support",
      responsePayload: null,
    }
  }

  if (data?.userEmailRegistrationInitiate.errors.length) {
    return {
      error: true,
      message: data?.userEmailRegistrationInitiate.errors[0].message,
      responsePayload: null,
    }
  }

  const emailRegistrationId = data?.userEmailRegistrationInitiate.emailRegistrationId
  redirect(`/security/email/verify?emailRegistrationId=${emailRegistrationId}`)
}

export const emailRegisterValidateServerAction = async (
  _prevState: VerifyEmailResponse,
  form: FormData,
): Promise<VerifyEmailResponse> => {
  const code = form.get("code")
  const emailRegistrationId = form.get("emailRegistrationId")

  if (
    !code ||
    typeof code !== "string" ||
    !emailRegistrationId ||
    typeof emailRegistrationId !== "string"
  ) {
    return {
      error: true,
      message: "Invalid values",
      responsePayload: null,
    }
  }

  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  if (!token || typeof token !== "string") {
    return {
      error: true,
      message: "Invalid Token",
      responsePayload: null,
    }
  }

  let codeVerificationResponse: UserEmailRegistrationValidateMutation | null | undefined
  try {
    codeVerificationResponse = await emailRegistrationValidate({
      code,
      emailRegistrationId,
    })
  } catch (err) {
    console.log("error in emailRegistrationValidate ", err)
    return {
      error: true,
      message:
        "Something went wrong Please try again and if error persist contact support",
      responsePayload: null,
    }
  }

  if (codeVerificationResponse?.userEmailRegistrationValidate.errors.length) {
    return {
      error: true,
      message: codeVerificationResponse?.userEmailRegistrationValidate.errors[0].message,
      responsePayload: null,
    }
  }

  redirect("/security")
}

export const deleteEmailServerAction = async () => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token && typeof token !== "string") {
    return
  }
  await deleteEmail()
  revalidatePath("/security")
}
