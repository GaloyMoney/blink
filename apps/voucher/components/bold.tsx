import React from "react"

interface BoldProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function Bold({ children, style }: BoldProps) {
  return (
    <span className="font-bold" style={style}>
      {children}
    </span>
  )
}
