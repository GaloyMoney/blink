import React from "react"

interface SubheadingProps {
  children: React.ReactNode
}
function SubHeading({ children }: SubheadingProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="text-center text-sm w-60">{children}</div>
    </div>
  )
}

export default SubHeading
