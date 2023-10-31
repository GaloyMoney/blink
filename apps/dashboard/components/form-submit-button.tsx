import React from "react"
import { Button } from "@mui/joy"

// Using ts-ignore to bypass the experimental function's type checking
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { experimental_useFormStatus as useFormStatus } from "react-dom"

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
