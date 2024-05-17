"use client"

import React, { ReactNode, FormEvent } from "react"

type ConfirmFormProps = {
  action: (formData: FormData) => Promise<void>
  children: ReactNode
  message: string
}

const ConfirmForm: React.FC<ConfirmFormProps> = ({ action, children, message }) => {
  function confirmUpdate(e: FormEvent) {
    if (!window.confirm(message)) {
      e.preventDefault()
    }
  }

  return (
    <form action={action} onSubmit={confirmUpdate}>
      {children}
    </form>
  )
}

export default ConfirmForm
