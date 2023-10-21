import React from "react"
import Image from "next/image"

const Logo: React.FC = () => {
  return (
    <div className="flex justify-center mb-4">
      <Image src="/blink_logo.svg" alt="Galoy" width={120} height={120} />
    </div>
  )
}

export default Logo
