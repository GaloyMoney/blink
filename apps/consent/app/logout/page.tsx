import { redirect } from "next/navigation"
import React from "react"

import { hydraClient } from "../../services/hydra"

interface logOutProps {
  logout_challenge: string
}

const submitForm = async (form: FormData) => {
  "use server"
  const logout_challenge = form.get("logout_challenge")
  const submitValue = form.get("submit")

  if (
    typeof logout_challenge === "string" &&
    typeof submitValue === "string" &&
    logout_challenge &&
    submitValue
  ) {
    if (submitValue === "No") {
      await hydraClient.rejectOAuth2LogoutRequest({
        logoutChallenge: logout_challenge,
      })
      redirect("/")
    }
    const response = await hydraClient.acceptOAuth2LogoutRequest({
      logoutChallenge: logout_challenge,
    })
    redirect(String(response.data.redirect_to))
  }
}

const Logout = async ({ searchParams }: { searchParams: logOutProps }) => {
  const { logout_challenge } = searchParams

  return (
    <main>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-lg shadow-lg w-1/3">
          <form action={submitForm} className="flex flex-col">
            <input type="hidden" name="logout_challenge" value={logout_challenge} />
            <p className="mb-4 text-gray-700 text-center">
              Are you sure you want to logout?
            </p>
            <div className="flex flex-col w-full">
              <button
                type="submit"
                id="accept"
                name="submit"
                value="Yes"
                className="mb-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-full"
              >
                Yes
              </button>
              <button
                type="submit"
                id="reject"
                name="submit"
                value="No"
                className="bg-red-500 text-white p-2 rounded hover:bg-red-700 w-full"
              >
                No
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

export default Logout
