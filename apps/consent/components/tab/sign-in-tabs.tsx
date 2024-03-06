"use client"
import { usePathname, useRouter } from "next/navigation"
import React from "react"
import Image from "next/image"

function SignInTab({ login_challenge }: { login_challenge: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const isPhoneLogin = pathname.includes("/login/phone")

  return (
    <div className="flex flex-row w-full justify-center items-center gap-1 mb-3 bg-[var(--inputBackground)] p-1 rounded-lg">
      <div
        data-testid="sign_in_with_email_btn"
        className={`flex justify-center items-center p-2 gap-3 ${!isPhoneLogin ? "bg-[var(--backgroundColor)]" : "bg-[var(--inputBackground)]"} rounded-lg cursor-pointer w-1/2`}
        onClick={() => router.replace(`/login?login_challenge=${login_challenge}`)}
      >
        <Image src="/logo/email.svg" alt="email" width={20} height={20} />
        <p className="font-semibold text-sm">Email</p>
      </div>
      <div
        data-testid="sign_in_with_phone_btn"
        className={`flex justify-center items-center p-2 gap-3 ${isPhoneLogin ? "bg-[var(--backgroundColor)]" : "bg-[var(--inputBackground)]"} rounded-lg cursor-pointer w-1/2`}
        onClick={() => router.replace(`/login/phone?login_challenge=${login_challenge}`)}
      >
        <Image src="/logo/phone.svg" alt="phone" width={20} height={20} />
        <p className="font-semibold text-sm">Phone</p>
      </div>
    </div>
  )
}

export default SignInTab
