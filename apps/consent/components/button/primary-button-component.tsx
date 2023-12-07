"use client"
import React, { ButtonHTMLAttributes } from "react"
import { Button } from "@galoy/galoy-components"

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
    <Button variant="default" disabled={loadOrDisable} {...buttonProps}>
      {loadOrDisable ? <Loader size="15px" /> : children}
    </Button>
  )
}

export default PrimaryButton
