import React from "react"
import Link from "next/link"

type LoginLinkProp = {
  href: string
}

const LoginLink: React.FC<LoginLinkProp> = ({ href }) => {
  return (
    <div className="flex justify-center mt-6">
      <div className="text-center text-sm ">
        <Link href={href} replace>
          <p className="font-medium text-sm">
            Already have an Account?{" "}
            <span className="font-semibold text-[var(--primaryButtonBackground)] dark:text-[var(--primaryButtonBackground)] hover:underline">
              Login Here.
            </span>
          </p>
        </Link>
      </div>
    </div>
  )
}

export default LoginLink
