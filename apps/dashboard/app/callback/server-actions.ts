"use server"
import { getServerSession } from "next-auth"

import { revalidatePath } from "next/cache"

import { authOptions } from "../api/auth/[...nextauth]/route"

import {
  callbackEndpointAdd,
  callbackEndpointDelete,
} from "@/services/graphql/mutations/callback-mutation"

export const createCallbackAction = async (_prevState: unknown, formData: FormData) => {
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
    }
  }

  let response
  try {
    response = await callbackEndpointAdd(callBackUrl, token)
  } catch (err) {
    return {
      error: true,
      message: "Something went wrong!",
    }
  }

  if (response?.callbackEndpointAdd.errors.length) {
    return {
      error: true,
      message: response?.callbackEndpointAdd.errors[0].message,
      data: null,
    }
  }

  revalidatePath("/callback")
  return {
    error: false,
    message: "success",
    data: null,
  }
}

export const deleteCallbackAction = async (callBackId: string) => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token || typeof token !== "string") {
    throw new Error("invalid token")
  }
  if (!callBackId || typeof callBackId !== "string") {
    return {
      error: true,
      message: "Please Provide a Valid Value",
    }
  }

  let response
  try {
    response = await callbackEndpointDelete(callBackId, token)
  } catch (err) {
    return {
      error: true,
      message: "Something went wrong!",
    }
  }

  if (response?.callbackEndpointDelete.errors.length) {
    return {
      error: true,
      message: response?.callbackEndpointDelete.errors[0].message,
      data: null,
    }
  }

  revalidatePath("/callback")
  return {
    error: false,
    message: "success",
    data: null,
  }
}
