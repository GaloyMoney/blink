import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import VerifyEmailForm from "./verify-form"

import {
  deleteEmail,
  emailRegistrationInitiate,
} from "@/services/graphql/mutations/email"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type VerifyEmailProp = {
  emailRegistrationId: string | null | undefined
}

export default async function VerifyEmail({
  searchParams,
}: {
  searchParams: VerifyEmailProp
}) {
  let { emailRegistrationId } = searchParams
  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  // this is if user has address but not verified
  if (!emailRegistrationId || typeof emailRegistrationId !== "string") {
    const email = session?.userData.data.me?.email?.address
    if (!email || typeof email !== "string" || !token) {
      redirect("/security")
    }

    await deleteEmail(token)
    let data
    try {
      data = await emailRegistrationInitiate(email, token)
    } catch (err) {
      console.log("error in emailRegistrationInitiate ", err)
      redirect("/security")
    }

    if (data?.userEmailRegistrationInitiate.errors.length) {
      redirect("/security")
    }

    emailRegistrationId = data?.userEmailRegistrationInitiate.emailRegistrationId
  }

  if (!emailRegistrationId && typeof emailRegistrationId !== "string") {
    redirect("/security")
  }

  return <VerifyEmailForm emailRegistrationId={emailRegistrationId}></VerifyEmailForm>
}
