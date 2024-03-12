"use client"
import Link from "next/link"
import React from "react"

function ErrorMessage({ errorMessage }: { errorMessage: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <p className="mb-4 text-lg font-semibold text-gray-700">{errorMessage}</p>
      <Link
        href="/"
        onClick={() => localStorage.removeItem("username")}
        className="px-4 py-2 text-sm font-semibold text-white bg-[var(--primaryColor)] rounded-full"
      >
        <div>Go back</div>
      </Link>
    </div>
  )
}

export default ErrorMessage
