"use client"
import React, { useEffect, useRef, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import Button from "../button"

const Navigation: React.FC = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleDropdown = () => setDropdownVisible((prev) => !prev)

  const navigate = (path: string) => {
    router.push(path)
    setDropdownVisible(false)
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
      {!session?.userData?.me?.id ? (
        <Button
          className="w-20"
          variant="link"
          onClick={() => navigate("/api/auth/signin")}
        >
          Login
        </Button>
      ) : (
        <div className="flex items-center">
          <div className="ml-4 relative">
            <button
              onClick={toggleDropdown}
              className="px-1 py-2 flex items-center text-white"
            >
              {dropdownVisible ? (
                <Image src="close-outline.svg" alt="close" height={40} width={40} />
              ) : (
                <Image src="menu-outline.svg" alt="menu" height={40} width={40} />
              )}
            </button>
            {dropdownVisible && (
              <div
                ref={dropdownRef}
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div
                  onClick={() => navigate("/create")}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  New Link
                </div>
                <div
                  onClick={() => navigate(`/user/links`)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  My Links
                </div>
                <div
                  onClick={() => {
                    signOut()
                    setDropdownVisible(false)
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation
