import React from "react"
import { cva, VariantProps } from "class-variance-authority"

import { cn } from "../utils"

const buttonVariants = cva("p-2.5 rounded-full transition focus:outline-none", {
  variants: {
    variant: {
      primary: "bg-primary text-white",
      secondary: "bg-secondary text-black",
      ghost: "bg-transparent text-black hover:bg-secondary",
      transparent: "bg-transparent text-black",
      link: "bg-transparent text-black hover:underline",
      outline: "bg-transparent text-black border-2 border-primary",
    },
    enabled: {
      true: "opacity-100 cursor-pointer",
      false: "opacity-50 cursor-not-allowed",
    },
  },
  defaultVariants: {
    variant: "primary",
    enabled: true,
  },
})

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = (props: ButtonProps) => {
  const { variant, enabled, className, ...otherProps } = props
  const buttonClass = cn(buttonVariants({ variant, enabled }), className)

  return <button className={buttonClass} {...otherProps}></button>
}

export default Button
