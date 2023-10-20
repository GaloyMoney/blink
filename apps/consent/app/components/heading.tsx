import React from "react"

interface headingProps {
  children: React.ReactNode
}

function Heading({ children }: headingProps) {
  return <h1 className="text-center mb-4 text-xl font-semibold">{children}</h1>
}

export default Heading
