"use server"
import { getServerSession } from "next-auth"

import { revalidatePath } from "next/cache"

import { authOptions } from "../api/auth/[...nextauth]/route"

import { CallBackAdditionResponse, CallBackDeletionResponse } from "./callback.types"

import {
  callbackEndpointAdd,
  callbackEndpointDelete,
} from "@/services/graphql/mutations/callback-mutation"

export const createCallbackAction = async (
  _prevState: CallBackAdditionResponse,
  formData: FormData,
): Promise<CallBackAdditionResponse> => {
  const session = await getServerSession(authOptions)
  const callBackUrl = formData.get("callBackUrl")
  console.log(callBackUrl)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    throw new Error("invalid token")
  }

  if (!callBackUrl || typeof callBackUrl !== "string") {
    return {
      error: true,
      message: "Please Provide a Valid Value",
      responsePayload: null,
    }
  }

  let response
  try {
    response = await callbackEndpointAdd(callBackUrl, token)
  } catch (err) {
    return {
      error: true,
      message: "Something went wrong!",
      responsePayload: null,
    }
  }

  if (response?.callbackEndpointAdd.errors.length) {
    return {
      error: true,
      message: response?.callbackEndpointAdd.errors[0].message,
      responsePayload: null,
    }
  }

  revalidatePath("/callback")
  return {
    error: false,
    message: "success",
    responsePayload: null,
  }
}

export const deleteCallbackAction = async (
  callBackId: string,
): Promise<CallBackDeletionResponse> => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    throw new Error("invalid token")
  }
  if (!callBackId || typeof callBackId !== "string") {
    return {
      error: true,
      message: "Please Provide a Valid Value",
      responsePayload: null,
    }
  }

  let response
  try {
    response = await callbackEndpointDelete(callBackId, token)
  } catch (err) {
    return {
      error: true,
      message: "Something went wrong!",
      responsePayload: null,
    }
  }

  if (response?.callbackEndpointDelete.errors.length) {
    return {
      error: true,
      message: response?.callbackEndpointDelete.errors[0].message,
      responsePayload: null,
    }
  }

  revalidatePath("/callback")
  return {
    error: false,
    message: "success",
    responsePayload: null,
  }
}
