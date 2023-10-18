"use server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  deleteEmail,
  emailRegistrationInitiate,
  emailRegistrationValidate,
} from "@/services/graphql/mutations/email";
import { from } from "@apollo/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { useFormState } from "react-dom";

export const emailRegisterInitiateServerAction = async (
  _prevState: unknown,
  form: FormData
) => {
  const email = form.get("email");
  if (!email || typeof email !== "string") {
    return {
      error: true,
      message: "Invalid Email",
      data: null,
    };
  }

  const session = await getServerSession(authOptions);
  const token = session?.accessToken;
  if (!token && typeof token !== "string") {
    return {
      error: true,
      message: "Invalid Token",
      data: null,
    };
  }

  if (
    session?.userData.data.me?.email?.address &&
    !session?.userData.data.me?.email?.verified
  ) {
    await deleteEmail(token);
  }

  const data = await emailRegistrationInitiate(email, token);
  if (data instanceof Error) {
    return {
      error: true,
      message: data.message,
      data: null,
    };
  }

  revalidatePath("/");
  return {
    error: false,
    message: "success",
    data: data,
  };
};

export const emailRegisterValidateServerAction = async (
  _prevState: unknown,
  form: FormData
) => {
  const code = form.get("code");
  const emailRegistrationId = form.get("emailRegistrationId");
  if (
    !code ||
    !emailRegistrationId ||
    typeof code !== "string" ||
    typeof emailRegistrationId !== "string"
  ) {
    return {
      error: true,
      message: "Invalid values",
      data: null,
    };
  }

  const session = await getServerSession(authOptions);
  const token = session?.accessToken;
  if (!token && typeof token !== "string") {
    return {
      error: true,
      message: "Invalid Token",
      data: null,
    };
  }

  const data = await emailRegistrationValidate(
    code,
    emailRegistrationId,
    token
  );
  if (data instanceof Error) {
    return {
      error: true,
      message: data.message,
      data: null,
    };
  }

  redirect("/profile");
};
