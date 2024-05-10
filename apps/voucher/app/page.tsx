import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth"

import { redirect } from "next/navigation"

import { authOptions } from "./api/auth/[...nextauth]/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)
  const authenticated = session?.userData.me?.id ? true : false

  if (!authenticated) {
    redirect("/redeem")
  }

  return (
    <div className="max-w-sm w-11/12 h-[calc(100dvh-7rem)] sm:h-[calc(100dvh-40rem)] m-auto grid grid-cols-1 gap-4 sm:mt-32">
      <Link href="/user/links">
        <Items imageSource="/my-voucher.svg" name="My Voucher" />
      </Link>
      <Link data-testid="create-link" href="/create">
        <Items imageSource="/create-new.svg" name="Create new Link" />
      </Link>
      <Link href="/redeem">
        <Items imageSource="/redeem-voucher.svg" name="Redeem Voucher" />
      </Link>
    </div>
  )
}

const Items = ({
  imageSource,
  name,
  height = 50,
  width = 50,
}: {
  imageSource: string
  name: string
  height?: number
  width?: number
}) => {
  return (
    <div className="bg-slate-100 p-5 rounded-lg h-full flex justify-center items-center flex-col gap-3">
      <Image
        priority={true}
        width={width}
        height={height}
        src={imageSource}
        alt={imageSource}
      />
      <p className="text-sm text-slate-900 font-semibold text-center">{name}</p>
    </div>
  )
}
