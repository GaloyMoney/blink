"use server"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { revalidatePath } from "next/cache"

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
  _prevState: unknown,
  form: FormData,
) => {
  const email = form.get("email")
  if (!email || typeof email !== "string") {
    return {
      error: true,
      message: "Invalid Email",
      data: null,
    }
  }

  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token && typeof token !== "string") {
    return {
      error: true,
      message: "Invalid Token",
      data: null,
    }
  }

  let data: UserEmailRegistrationInitiateMutation | null | undefined
  try {
    data = await emailRegistrationInitiate(email, token)
  } catch (err) {
    console.log("error in emailRegistrationInitiate ", err)
    return {
      error: true,
      message:
        "Something went wrong Please try again and if error persist contact support",
      data: null,
    }
  }

  if (data?.userEmailRegistrationInitiate.errors.length) {
    return {
      error: true,
      message: data?.userEmailRegistrationInitiate.errors[0].message,
      data: null,
    }
  }

  const emailRegistrationId = data?.userEmailRegistrationInitiate.emailRegistrationId
  redirect(`/security/email/verify?emailRegistrationId=${emailRegistrationId}`)
}

export const emailRegisterValidateServerAction = async (
  _prevState: unknown,
  form: FormData,
) => {
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
      data: null,
    }
  }

  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  if (!token || typeof token !== "string") {
    return {
      error: true,
      message: "Invalid Token",
      data: null,
    }
  }

  let codeVerificationResponse: UserEmailRegistrationValidateMutation | null | undefined
  try {
    codeVerificationResponse = await emailRegistrationValidate(
      code,
      emailRegistrationId,
      token,
    )
  } catch (err) {
    console.log("error in emailRegistrationValidate ", err)
    return {
      error: true,
      message:
        "Something went wrong Please try again and if error persist contact support",
      data: null,
    }
  }

  if (codeVerificationResponse?.userEmailRegistrationValidate.errors.length) {
    return {
      error: true,
      message: codeVerificationResponse?.userEmailRegistrationValidate.errors[0].message,
      data: null,
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
  await deleteEmail(token)
  revalidatePath("/security")
}
