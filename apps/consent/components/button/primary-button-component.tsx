"use client"
import React, { ButtonHTMLAttributes } from "react"

import { useFormStatus } from "react-dom"

import Loader from "../loader"

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  children: React.ReactNode
  disabled?: boolean
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  disabled = false,
  ...buttonProps
}) => {
  const { pending } = useFormStatus()
  const loadOrDisable = pending || disabled
  return (
    <button
      disabled={loadOrDisable}
      {...buttonProps}
      className={`flex-1 ${
        !loadOrDisable
          ? "bg-[var(--primaryButtonBackground)]"
          : "bg-[var(--primaryButtonBackground)]"
      } text-[var(--primaryButtonFont)] p-2 rounded-lg text-sm hover:bg-[var(--primaryButtonBackground)]`}
    >
      {loadOrDisable ? <Loader size="15px" /> : children}
    </button>
  )
}

export default PrimaryButton
