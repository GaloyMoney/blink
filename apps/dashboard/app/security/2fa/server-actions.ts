"use server"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { revalidatePath } from "next/cache"

import { TotpRegisterResponse, TotpValidateResponse } from "./totp.types"

import {
  userTotpRegistrationInitiate,
  userTotpRegistrationValidate,
  userTotpDelete,
} from "@/services/graphql/mutations/totp"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

import {
  UserTotpRegistrationInitiateMutation,
  UserTotpRegistrationValidateMutation,
} from "@/services/graphql/generated"

export const totpRegisterInitiateServerAction =
  async (): Promise<TotpRegisterResponse> => {
    const session = await getServerSession(authOptions)
    const token = session?.accessToken
    if (!token && typeof token !== "string") {
      return {
        error: true,
        message: "Invalid Token",
        responsePayload: null,
      }
    }

    let data: UserTotpRegistrationInitiateMutation | null | undefined
    try {
      data = await userTotpRegistrationInitiate(token)
    } catch (err) {
      console.log("error in userTotpRegistrationInitiate ", err)
      return {
        error: true,
        message:
          "Something went wrong. Please try again. If the error persists, contact support.",
        responsePayload: null,
      }
    }

    if (data?.userTotpRegistrationInitiate.errors.length) {
      return {
        error: true,
        message: data?.userTotpRegistrationInitiate.errors[0].message,
        responsePayload: null,
      }
    }

    const totpRegistrationId = data?.userTotpRegistrationInitiate.totpRegistrationId
    const totpSecret = data?.userTotpRegistrationInitiate.totpSecret
    return {
      error: false,
      message: "",
      responsePayload: {
        totpRegistrationId,
        totpSecret,
      },
    }
  }

export const totpRegisterValidateServerAction = async (
  _prevState: TotpValidateResponse,
  form: FormData,
): Promise<TotpValidateResponse> => {
  const totpCode = form.get("code")
  const totpRegistrationId = form.get("totpRegistrationId")
  if (
    !totpCode ||
    typeof totpCode !== "string" ||
    !totpRegistrationId ||
    typeof totpRegistrationId !== "string"
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

  let totpValidationResponse: UserTotpRegistrationValidateMutation | null | undefined
  try {
    totpValidationResponse = await userTotpRegistrationValidate(
      totpCode,
      totpRegistrationId,
      token,
    )
  } catch (err) {
    console.log("error in userTotpRegistrationValidate ", err)
    return {
      error: true,
      message:
        "Something went wrong. Please try again. If the error persists, contact support.",
      responsePayload: null,
    }
  }

  if (totpValidationResponse?.userTotpRegistrationValidate.errors.length) {
    return {
      error: true,
      message: totpValidationResponse?.userTotpRegistrationValidate.errors[0].message,
      responsePayload: null,
    }
  }

  redirect("/security")
}

export const deleteTotpServerAction = async () => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token && typeof token !== "string") {
    return
  }
  await userTotpDelete(token)
  revalidatePath("/security")
}
