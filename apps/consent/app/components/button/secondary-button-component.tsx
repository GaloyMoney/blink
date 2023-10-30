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
      className={`flex-1 border-[var(--primaryButtonBackground)] bg-transparent text-[var(--inputColor)] p-2 rounded-lg text-sm border-2 transition-all duration-300 ease-in-out hover:bg-[var(--primaryButtonBackground)] hover:text-[var(--primaryButtonFont)] hover:border-transparent`}
    >
      {children}
    </button>
  )
}

export default SecondaryButton
