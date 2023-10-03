import React from "react"
import Image from "next/image"

const Logo: React.FC = () => {
  return (
    <div className="flex justify-center mb-4">
      {/* TODO use Blink logo ?  */}
      <Image src="/favicon.ico" alt="Galoy" width={50} height={50} />
    </div>
  )
}

export default Logo
