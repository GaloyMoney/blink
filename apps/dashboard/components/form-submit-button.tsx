import React from "react"
import { Button } from "@mui/joy"

import { useFormStatus } from "react-dom"

type FormButtonProps = Omit<React.ComponentProps<typeof Button>, "loading">

const FormSubmitButton: React.FC<FormButtonProps> = ({ children, ...props }) => {
  const { pending } = useFormStatus()
  return (
    <Button {...props} loading={pending}>
      {children}
    </Button>
  )
}

export default FormSubmitButton
