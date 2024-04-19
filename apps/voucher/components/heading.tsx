import React, { ReactNode } from "react"

interface HeadingProps {
  children: ReactNode
  [x: string]: ReactNode
}

export default function Heading({ children, ...props }: HeadingProps) {
  return (
    <h1
      style={{
        textAlign: "center",
      }}
      className="text-2xl  text-center w-9/10"
      {...props}
    >
      {children}
    </h1>
  )
}
