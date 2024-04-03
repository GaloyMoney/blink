"use client"
import Link from "next/link"

import Button from "@/components/Button/Button"
// path : /
//TODO home page or welcome screen needed to be created gere
export default function Home() {
  return (
    <div className="flex flex-col mt-36 items-center text-center">
      <h1 className="text-7xl font-bold">Galoy Withdraw</h1>
      <p className="mt-1 text-6xl">Start creating withdraw links</p>
      <div className="flex flex-col mt-8 space-y-4">
        <Link href="/user/aaaaaaaa-e098-4a16-932b-e4f4abc24366/links">
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
