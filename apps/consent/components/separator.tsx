import React, { ReactNode } from "react"

interface SeparatorProps {
  children: ReactNode
}

const Separator: React.FC<SeparatorProps> = ({ children }) => {
  return (
    <div className="relative flex items-center justify-center mb-4">
      <div className="absolute inset-y-0 left-0 flex items-center justify-center w-1/2">
        <div className="h-px bg-[var(--inputSecondary)] w-full"></div>
      </div>
      <span className="relative z-10 bg-[var(--backgroundColor)] px-2 text-[var(--inputSecondary)] text-sm ">
        {children}
      </span>
      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-1/2">
        <div className="h-px bg-[var(--inputSecondary)] w-full"></div>
      </div>
    </div>
  )
}

export default Separator
