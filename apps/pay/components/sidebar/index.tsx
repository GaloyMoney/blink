"use client"

import { usePathname } from "next/navigation"

import Image from "next/image"

import Link from "next/link"

import { OverlayTrigger, Tooltip } from "react-bootstrap"

import { useState } from "react"

import CurrencyDropdown from "../currency/currency-dropdown"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTrigger } from "../sheet"
import PinToHomescreen from "../pin-to-homescreen"

import { useInvoiceContext } from "@/context/invoice-context"
import { ACTIONS } from "@/app/reducer"
import { getClientSidePayDomain } from "@/config/config"

function updateCurrencyAndReload(newDisplayCurrency: string): void {
  localStorage.setItem("displayCurrency", newDisplayCurrency)
  const currentURL = new URL(window.location.toString())
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set("displayCurrency", newDisplayCurrency)
  currentURL.search = searchParams.toString()
  window.location.href = currentURL.toString()
}

export function SideBar({ username }: { username: string }) {
  const pathName = usePathname()
  const [copied, setCopied] = useState(false)

  const { state, dispatch } = useInvoiceContext()
  const lightningAddr = username
    ? `${username?.toString().toLowerCase()}@${getClientSidePayDomain()}`
    : ""

  const Links = [
    {
      name: "Cash Register",
      href: `/${username}`,
      icon: "/icons/cash-register-icon.svg",
      dataTestId: "cash-register-link",
      hardRefresh: true,
    },
    {
      name: "Printable Paycode",
      href: `/${username}/print`,
      icon: "/paycode-black&white.svg",
      dataTestId: "printable-paycode-link",
      hardRefresh: false,
    },
  ]

  async function shareCurrentUrl() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        })
        console.log("URL shared successfully")
      } catch (error) {
        console.error("Error sharing the URL:", error)
      }
    } else {
      console.log("Web Share API not supported. Fallback to copy URL manually.")
    }
  }

  return (
    <>
      <PinToHomescreen
        pinnedToHomeScreenModalVisible={state.pinnedToHomeScreenModalVisible}
        dispatch={dispatch}
      />
      <Sheet>
        <SheetTrigger asChild>
          <button data-testid="menu" className="space-y-2">
            <span className="block w-8 h-0.5 bg-black"></span>
            <span className="block w-8 h-0.5 bg-black"></span>
            <span className="block w-8 h-0.5 bg-black"></span>
          </button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <p className="text-xl font-semibold text-left">Pay {username}</p>
          </SheetHeader>
          <div className="grid gap-3 py-3  ">
            {Links.map((link) =>
              pathName === link.href ? (
                <span
                  key={link.name}
                  className="bg-slate-200 text-black p-2 rounded-md flex items-center gap-2"
                >
                  <Image src={link.icon} alt={link.name} width={24} height={24} />
                  {link.name}
                </span>
              ) : link.hardRefresh ? (
                <a
                  key={link.name}
                  href={link.href}
                  data-testid={link.dataTestId}
                  className="bg-white text-black p-2 rounded-md no-underline hover:no-underline visited:text-black flex items-center gap-2"
                >
                  <Image src={link.icon} alt={link.name} width={24} height={24} />
                  {link.name}
                </a>
              ) : (
                <SheetClose key={link.name} asChild>
                  <Link
                    data-testid={link.dataTestId}
                    href={link.href}
                    className="bg-white text-black p-2 rounded-md no-underline hover:no-underline visited:text-black flex items-center gap-2"
                  >
                    <Image src={link.icon} alt={link.name} width={24} height={24} />
                    {link.name}
                  </Link>
                </SheetClose>
              ),
            )}

            <div className="flex justify-between align-content-center">
              <div className="text-md font-semibold flex justify-center items-center">
                Currency
              </div>
              <CurrencyDropdown
                onSelectedDisplayCurrencyChange={updateCurrencyAndReload}
              />
            </div>
            <div className="flex flex-row justify-between align-middle align-content-center ">
              <div className="flex flex-col gap-0 p-0">
                <p className="text-md font-semibold mb-1">lightning address</p>
                <p className="text-sm">{lightningAddr}</p>
              </div>

              <OverlayTrigger
                show={copied}
                placement="bottom"
                overlay={<Tooltip id="copy">Copied!</Tooltip>}
              >
                <button
                  onClick={() => {
                    setCopied(true)
                    navigator.clipboard.writeText(lightningAddr)
                    setTimeout(() => {
                      setCopied(false)
                    }, 1000)
                  }}
                >
                  <Image
                    src="/icons/copy-icon.svg"
                    alt="copy"
                    width={20}
                    height={20}
                  ></Image>
                </button>
              </OverlayTrigger>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 mt-2">
              <button
                onClick={shareCurrentUrl}
                className="bg-[var(--primary)] rounded-full p-2 text-white w-40 flex justify-center align-content-center gap-2"
              >
                <Image
                  src="/icons/share-icon-white.svg"
                  alt="share"
                  width={20}
                  height={20}
                ></Image>
                Share
              </button>
              <SheetClose asChild>
                <button
                  className="bg-slate-200 rounded-full p-2  w-52 flex justify-center align-content-center gap-2"
                  onClick={() => {
                    dispatch({
                      type: ACTIONS.PINNED_TO_HOMESCREEN_MODAL_VISIBLE,
                      payload: !state.pinnedToHomeScreenModalVisible,
                    })
                  }}
                >
                  <Image
                    width={20}
                    height={20}
                    src="/icons/pin-icon.svg"
                    alt="pin icon"
                  />
                  Pin to homescreen
                </button>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
