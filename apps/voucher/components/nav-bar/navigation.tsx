"use client"
import React from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import Button from "../button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../sheet"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select"

import { useCurrency } from "@/context/currency-context"

const Navigation: React.FC = () => {
  const router = useRouter()
  const { data: session, status } = useSession()

  const navigate = (path: string) => {
    router.push(path)
  }

  return (
    <nav className="w-11/12 max-w-4xl m-auto flex flex-row justify-between align-middle h-11 mt-3 mb-2">
      <Link href={"/"} className="flex items-center">
        <Image
          src="/blink-voucher-logo.svg"
          alt="Blink Voucher Logo"
          width={170}
          height={170}
        />
      </Link>
      {status === "loading" ? null : !session?.userData?.me?.id ? (
        <Button
          className="w-20"
          variant="link"
          onClick={() => navigate("/api/auth/signin")}
        >
          Login
        </Button>
      ) : (
        <div className="flex items-center">
          <NavMenu username={session.userData.me.username} />
        </div>
      )}
    </nav>
  )
}

export default Navigation

const NavMenu = ({ username }: { username: string }) => {
  const menuItems = [
    { path: "/create", label: "Create Link", icon: "/create-voucher-outline.svg" },
    { path: "/user/links", label: "My Links", icon: "/links-outline.svg" },
    { path: "/redeem", label: "Redeem", icon: "/redeem-outline.svg" },
  ]

  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger>
        <Image src="menu-outline.svg" alt="menu" height={40} priority={true} width={40} />
      </SheetTrigger>
      <SheetContent className="m-0 p-0">
        {username ? (
          <SheetHeader className="flex flex-col pl-5 text-left mt-6 justify-center align-middle w-full">
            <SheetTitle>{username}</SheetTitle>
          </SheetHeader>
        ) : null}
        <div className={`mt-${username ? "6" : "14"}`}>
          <CurrencySwitcher />
        </div>
        <div className="flex flex-col align-center gap-1 w-full mt-4">
          {menuItems.map((item) => (
            <div
              className={`flex w-11/12 m-auto justify-center align-middle rounded-md p-2 cursor-pointer ${
                pathname === item.path ? "bg-secondary" : "hover:bg-secondary"
              }`}
              key={item.path}
            >
              <SheetClose asChild>
                <Link
                  className="w-full flex justify-center align-middle"
                  href={item.path}
                >
                  <Image
                    width={25}
                    height={25}
                    alt={item.label}
                    priority={true}
                    src={item.icon}
                  ></Image>
                  <div className="w-full pl-5">{item.label}</div>
                </Link>
              </SheetClose>
            </div>
          ))}
          <SheetClose asChild>
            <div className="flex w-11/12 m-auto justify-center hover:bg-secondary p-2 align-middle rounded-md cursor-pointer">
              <Image
                width={26}
                height={26}
                alt="logout"
                priority={true}
                src="/log-out-outline-red.svg"
              ></Image>
              <div
                className="w-full text-error pl-5"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Log Out
              </div>
            </div>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export const CurrencySwitcher = () => {
  const { currency: selectedCurrency, changeCurrency, currencyList } = useCurrency()

  return (
    <div className="w-11/12 m-auto flex gap-1 flex-col">
      <div className="text-md font-semibold">Currency</div>
      <Select onValueChange={(value) => changeCurrency(value)}>
        <SelectTrigger className="text-md">
          <SelectValue placeholder={selectedCurrency} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {currencyList.map((currency) => (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.name} ({currency.id})
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
