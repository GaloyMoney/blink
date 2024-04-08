"use client"
import Link from "next/link"

import Button from "@/components/Button/Button"
import { useSession } from "next-auth/react"
// path : /
//TODO home page or welcome screen needed to be created here
export default function Home() {
  const session = useSession()
  console.log(session)

  return (
    <div className="flex flex-col mt-36 items-center text-center">
      <h1 className="text-7xl font-bold">Blink Voucher</h1>
      <div className="flex flex-col mt-8 space-y-4">
        <Link href="/user/links">
          <Button>My links</Button>
        </Link>
        <Link href="/create">
          <Button>Create new Link</Button>
        </Link>
        <Link href="/voucher">
          <Button>Redeem Voucher</Button>
        </Link>
      </div>
    </div>
  )
}
