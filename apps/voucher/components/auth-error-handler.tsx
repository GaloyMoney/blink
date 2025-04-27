"use client"
import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

/**
 * Component to handle authentication errors
 * This component will monitor the session for errors and sign out the user if needed
 */
export default function AuthErrorHandler() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If there's an error in the session, sign out the user
    if (session?.error === "RefreshAccessTokenError") {
      console.error("Session error detected: RefreshAccessTokenError")
      // Sign out the user and redirect to the login page
      signOut({ callbackUrl: "/api/auth/signin" })
    }
  }, [session, router])

  // This component doesn't render anything
  return null
}
