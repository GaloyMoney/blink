"use client"
import Link from "next/link"

import Button from "@/components/button"
// path : /
//TODO home page or welcome screen needed to be created here
export default function Home() {
  return (
    <div className="flex flex-col mt-36 items-center text-center">
      <h1 className="text-7xl font-bold">Blink Voucher</h1>
      <div className="flex flex-col mt-8 space-y-4">
        <Link href="/user/links">
          <Button>My links</Button>
        </Link>
        <Link href="/create">
          <Button data-testid="create-link">Create new Link</Button>
        </Link>
        <Link href="/voucher">
          <Button>Redeem Voucher</Button>
        </Link>
      </div>
    </div>
  )
}
