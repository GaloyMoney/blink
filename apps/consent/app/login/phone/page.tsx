import React from "react"

import PhoneAuth from "@/components/phone-auth"

interface LoginProps {
  login_challenge: string
}

const Login = async ({ searchParams }: { searchParams: LoginProps }) => {
  const { login_challenge } = searchParams
  const authAction = "Login"
  return <PhoneAuth login_challenge={login_challenge} authAction={authAction} />
}
export default Login
