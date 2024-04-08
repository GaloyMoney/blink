"use client"
import React, { useEffect } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { useSession } from "next-auth/react"
import AddIcon from "@mui/icons-material/Add"
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle"

import styles from "./NavBar.module.css"
import Link from "next/link"

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

  const toggleDropdown = () => setDropdownVisible(!dropdownVisible)

  const navigate = (path: string) => {
    router.push(path)
    setDropdownVisible(false)
  }

  return (
    <nav className={styles.header}>
      <Link href={"/"} className="flex items-center">
        <h3 className="text-xl font-bold">Blink Voucher</h3>
      </Link>
      <div className="flex items-center">
        {session && (
          <button onClick={() => navigate("/create")} className={styles.add_new_button}>
            <AddIcon style={{ color: "white", marginRight: "4px" }} />
            New Link
          </button>
        )}

        <div className="ml-4 relative">
          <button
            onClick={toggleDropdown}
            className="px-1 py-2 flex items-center text-white"
          >
            <ArrowDropDownCircleIcon style={{ color: "black" }} />
          </button>
          {dropdownVisible && (
            <div
              ref={dropdownRef}
              className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              {session && session.userData.me?.id ? (
                <>
                  <a
                    onClick={() => navigate("/create")}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    New Link
                  </a>
                  <a
                    onClick={() => navigate(`/user/links`)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Links
                  </a>
                  <a
                    onClick={() => {
                      signOut()
                      setDropdownVisible(false)
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </a>
                </>
              ) : (
                <a
                  onClick={() => navigate("/api/auth/signin")}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Login
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
