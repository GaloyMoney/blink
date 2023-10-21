import React from "react"

type FromProps = {
  action?: (formData: FormData) => void
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  children?: React.ReactNode
}

function FormComponent({ action, children, onSubmit }: FromProps) {
  return (
    <form action={action} className="flex flex-col" onSubmit={onSubmit}>
      {children}
    </form>
  )
}

export default FormComponent
