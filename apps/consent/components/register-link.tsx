import React from "react"
import Link from "next/link"

type RegisterLinkProp = {
  href: string
}

const RegisterLink: React.FC<RegisterLinkProp> = ({ href }) => {
  return (
    <div className="flex justify-center">
      <div className="text-center text-sm ">
        <Link href={href} replace>
          <p className="font-medium text-sm">
            Don&apos;t have an Account?{" "}
            <span className="font-semibold text-[var(--primaryButtonBackground)] dark:text-[var(--primaryButtonBackground)] hover:underline">
              Register Here.
            </span>
          </p>
        </Link>
      </div>
    </div>
  )
}

export default RegisterLink
