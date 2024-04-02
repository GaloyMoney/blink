"use client"
import { signOut } from "next-auth/react"
import React from "react"

type Prop = {
  searchParams: {
    errorMessage: string
  }
}

function page({ searchParams }: Prop) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <p className="mb-4 text-lg font-semibold text-gray-700 text-center p-1 max-w-96">
        {searchParams.errorMessage}
      </p>
      <div
        onClick={() => {
          localStorage.removeItem("username")
          signOut({
            callbackUrl: "/setuppwa",
          })
        }}
        className="px-4 py-2 text-sm font-semibold text-white bg-[var(--primary3)] rounded-full cursor-pointer"
      >
        <div>Go Back</div>
      </div>
    </div>
  )
}

export default page
