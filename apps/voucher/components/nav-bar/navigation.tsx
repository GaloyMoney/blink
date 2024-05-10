"use client"
import React from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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

import { Separator } from "@/components/separator"

import { useDisplayCurrency } from "@/hooks/useDisplayCurrency"
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
    { path: "/create", label: "Create Link" },
    { path: "/user/links", label: "My Links" },
    { path: "/redeem", label: "Redeem" },
  ]

  return (
    <Sheet>
      <SheetTrigger>
        <Image src="menu-outline.svg" alt="menu" height={40} priority={true} width={40} />
      </SheetTrigger>
      <SheetContent className="m-0 p-0">
        {username ? (
          <>
            <SheetHeader className="flex flex-col pl-5 text-left mt-6 justify-center align-middle w-full">
              <SheetTitle>{username}</SheetTitle>
            </SheetHeader>
            <Separator className="mt-5" />
          </>
        ) : null}
        <div
          className={`flex flex-col text-left ${
            username ? "mt-5" : "mt-20"
          } justify-center align-middle w-11/12 border-2 border-secondary m-auto rounded-lg`}
        >
          {menuItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <SheetClose asChild>
                <Link className="w-full" href={item.path}>
                  <div className="w-full hover:bg-secondary p-3 pl-5">{item.label}</div>
                </Link>
              </SheetClose>
              {index < menuItems.length - 1 && <Separator />}
            </React.Fragment>
          ))}
          <Separator />
          <SheetClose asChild>
            <div
              className="w-full hover:bg-secondary p-3 pl-5"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Log Out
            </div>
          </SheetClose>
        </div>
        <div className="mt-4">
          <CurrencySwitcher />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export const CurrencySwitcher = () => {
  const currencies = useDisplayCurrency()
  const { currency: selectedCurrency, changeCurrency } = useCurrency()

  return (
    <div className="w-11/12 m-auto">
      <Select onValueChange={(value) => changeCurrency(value)}>
        <SelectTrigger className="text-md">
          <SelectValue placeholder={selectedCurrency} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {currencies.currencyList.map((currency) => (
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
