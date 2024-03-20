"use client"

import Image from "next/image"

import { useFormState } from "react-dom"

import SearchIcon from "../../components/icons/search.svg"

import { transactionSearch } from "./search-action"

const initialState = {
  message: "",
}

export default function Account({ children }: { children: React.ReactNode }) {
  const [state, formAction] = useFormState(transactionSearch, initialState)

  return (
    <>
      <header className="z-40 py-4 bg-white shadow-bottom">
        <div className="container flex items-center justify-between h-full px-6 mx-auto text-blue-600">
          <div className="flex justify-center flex-1 lg:mr-32">
            <div className="border rounded relative w-full max-w-xl p-2 focus-within:text-blue-500">
              <div className="absolute inset-y-0 flex items-center pl-2">
                <Image
                  src={SearchIcon}
                  alt="search"
                  className="w-4 h-4"
                  aria-hidden="true"
                />
              </div>
              <form action={formAction}>
                <input
                  id="search"
                  name="search"
                  autoFocus
                  type="text"
                  aria-label="Search"
                  className="block w-full text-sm focus:outline-none form-input leading-5 focus:border-blue-400 focus:shadow-outline-blue pl-8 text-gray-700"
                  placeholder={"Enter transaction's hash or id"}
                />
              </form>
            </div>
          </div>
        </div>
        {state?.message && (
          <p
            aria-live="polite"
            className="block w-full text-sm focus:outline-none form-input leading-5 focus:border-blue-400 focus:shadow-outline-blue pl-8 text-gray-700"
          >
            {state?.message}
          </p>
        )}
      </header>
      {children}
    </>
  )
}
