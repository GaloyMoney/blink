"use client"
import React, { ButtonHTMLAttributes } from "react"
// ts-ignore because experimental_useFormStatus is not in the types
/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line error
import { experimental_useFormStatus as useFormStatus } from "react-dom"

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  children: React.ReactNode
  disabled?: boolean
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  disabled = false,
  ...buttonProps
}) => {
  const { pending } = useFormStatus()
  return (
    <button
      disabled={pending || disabled}
      {...buttonProps}
      className={`flex-1 border-orange-500 bg-transparent text-gray-800 p-2 rounded-lg text-sm border-2 transition-all duration-300 ease-in-out hover:bg-orange-500 hover:text-white hover:border-transparent`}
    >
      {children}
    </button>
  )
}

export default SecondaryButton
