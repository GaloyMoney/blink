"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { signOut } from "next-auth/react"

import PeopleIcon from "./icons/people.svg"
import TransactionsIcon from "./icons/transactions.svg"
import GlobeIcon from "./icons/search-globe.svg"
import LogoutIcon from "./icons/logout.svg"

const dashboardRoutes = [
  {
    name: "Account details",
    icon: PeopleIcon,
    path: "/account",
  },
  {
    name: "Transactions",
    icon: TransactionsIcon,
    path: "/transactions",
  },
  {
    name: "Merchants",
    icon: GlobeIcon,
    path: "/merchants",
  },
  {
    name: "Notifications",
    icon: GlobeIcon,
    path: "/notifications",
  },
]

function SideBar() {
  const pathname = usePathname()

  return (
    <aside className="z-30 flex-shrink-0 hidden w-64 overflow-y-auto bg-white lg:block">
      <div className="py-4 text-gray-500">
        <Link className="ml-6 text-lg font-bold text-gray-800" href="/account">
          <Image
            src="/logo.png"
            alt="Bitcoin Beach logo"
            className="w-9 inline filter invert"
            width={81}
            height={76}
            priority={true}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />{" "}
          Admin Panel
        </Link>
        <ul className="mt-6">
          {dashboardRoutes.map((route) => (
            <li className="relative px-6 py-3" key={route.name}>
              <Link
                href={route.path}
                className="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800"
              >
                <>
                  {pathname === route.path && (
                    <span
                      className="absolute inset-y-0 left-0 w-1 bg-blue-600 rounded-tr-lg rounded-br-lg"
                      aria-hidden="true"
                    ></span>
                  )}
                  <Image
                    className="w-5 h-5"
                    aria-hidden="true"
                    src={route.icon}
                    alt={route.name}
                  />
                  <span className="ml-4">{route.name}</span>
                </>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-6 py-3 fixed bottom-0 text-gray-500">
        <Link
          href="#"
          onClick={() => signOut()}
          className="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800"
        >
          <>
            <Image src={LogoutIcon} className="w-5 h-5" aria-hidden="true" alt="Logout" />
            <span className="ml-4">Logout</span>
          </>
        </Link>
      </div>
    </aside>
  )
}

export default SideBar
