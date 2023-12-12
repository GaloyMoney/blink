import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { totpRegisterInitiateServerAction } from "../server-actions"

import VerifyTwoFactorAuth from "./verify-form"

import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function VerifyTwoFactorAuthPage() {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  const totpEnabled = session?.userData.data.me?.totpEnabled

  if (!token || typeof token !== "string" || totpEnabled === true) {
    redirect("/security")
  }

  const { error, responsePayload, message } = await totpRegisterInitiateServerAction()
  if (error || !responsePayload?.totpRegistrationId || !responsePayload?.totpSecret) {
    console.error(message)
    const errorMessage = message || "Something Went Wrong"
    throw new Error(errorMessage)
  }

  return (
    <VerifyTwoFactorAuth
      totpRegistrationId={responsePayload.totpRegistrationId}
      totpSecret={responsePayload.totpSecret}
    ></VerifyTwoFactorAuth>
  )
}
