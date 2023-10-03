"use client"
import React, { ButtonHTMLAttributes } from "react"
import { experimental_useFormStatus as useFormStatus } from "react-dom"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  children: React.ReactNode
}

const ButtonComponent: React.FC<ButtonProps> = ({ children, ...buttonProps }) => {
  const { pending } = useFormStatus()
  return (
    <button
      disabled={pending}
      {...buttonProps}
      className="flex-1 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-700"
    >
      {pending ? "loading" : children}
    </button>
  )
}

export default ButtonComponent
