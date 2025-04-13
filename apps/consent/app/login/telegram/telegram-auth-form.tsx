"use client"
import React, { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { useRouter } from "next/navigation"

import { cancelAuth, telegramAuth } from "./server-actions"

import SecondaryButton from "@/components/button/secondary-button-component"

interface TelegramAuthFormProps {
  login_challenge: string
  phone: string
  nonce: string
}

const TELEGRAM_BOT_ID = 5130895329
const TELEGRAM_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAweXJKoO7pm6oRUuO+vir
VdQlAEKE6qXAzfF7o7m2WaHBCOQok5h7R2xzUffjKfuco2qQUUsoMqfd8XKFZ703
YkbH0xvuCmbe3vE/8kGL8IXDVGicv7O3OpRecEZocy5HQUOfritlzXU2WAcFSqt5
vWh6Ej6nFLtntcGBf747I4tZjae4J8XkQg0zf59mlIAQG3PVStEdJnDyskWpQH0Q
HuJCrkxMdq0OHNrzS//8OXb6UgRZYRSUCL7ZBO2kpK3RU/gprcvStlh3ZJUNt59P
P1Dl+JcSvvWQM07rmi8UxIH67jVL8qz4rD9G9iV4BpHAO7rwA3AEEwMs55lX8LUQ
HQIDAQAB
-----END PUBLIC KEY-----`

const TelegramAuthForm: React.FC<TelegramAuthFormProps> = ({
  login_challenge,
  phone,
  nonce,
}) => {
  const telegramButtonRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCancel = async () => {
    try {
      await cancelAuth(login_challenge)
    } catch (err) {
      console.error("Error canceling auth:", err)
    }
  }

  // Handle Telegram auth manually instead of using callback_url
  const handleTelegramAuth = async () => {
    setLoading(true)
    setError(null)

    // The SDK will automatically handle the deep linking
    // We'll use window.Telegram.Passport.auth directly instead of createAuthButton
    if (typeof window.Telegram !== "undefined") {
      // Create auth data
      const authData = {
        bot_id: TELEGRAM_BOT_ID,
        scope: {
          data: ["phone_number"],
          v: 1,
        },
        public_key: TELEGRAM_PUBLIC_KEY,
        nonce: nonce,
      }

      // Custom tooltip toggle function to handle status
      const tooltipToggle = (show: boolean) => {
        console.log("tooltipToggle", show)
        if (!show) {
          // When Telegram app is closed/returned, check auth status
          checkAuthStatus()
        }
      }

      try {
        // Pass auth data to Telegram SDK without callback_url
        window.Telegram.Passport.auth(authData, tooltipToggle)
      } catch (err) {
        console.error("Error launching Telegram auth:", err)
        setLoading(false)
        setError("Failed to launch Telegram authentication. Please try again.")
      }
    } else {
      setLoading(false)
      setError("Telegram SDK not loaded. Please refresh the page and try again.")
    }
  }

  // Check auth status periodically after Telegram app is opened
  const checkAuthStatus = async () => {
    try {
      const result = await telegramAuth(login_challenge, phone, nonce)

      if (result.success && result.redirectUrl) {
        router.push(result.redirectUrl)
        return
      }

      setLoading(false)
      setError(result.message || "Authentication failed")
    } catch (error) {
      console.error("Error during authentication:", error)

      setLoading(false)
      setError("Authentication failed after multiple attempts. Please try again.")
    }
  }

  useEffect(() => {
    // Initialize Telegram Passport button after the SDK is loaded
    const initTelegramPassport = () => {
      if (typeof window.Telegram !== "undefined" && telegramButtonRef.current) {
        // Create callback URL - this will be the endpoint that Telegram calls after auth
        // const callbackUrl = `${window.location.origin}/api/telegram/callback?login_challenge=${encodeURIComponent(login_challenge)}&phone=${encodeURIComponent(phone)}&nonce=${encodeURIComponent(nonce)}`

        // Create auth button using Telegram SDK
        window.Telegram.Passport.createAuthButton(
          telegramButtonRef.current,
          {
            bot_id: TELEGRAM_BOT_ID,
            scope: {
              data: ["phone_number"],
              v: 1,
            },
            public_key: TELEGRAM_PUBLIC_KEY,
            nonce: nonce,
            // callback_url: callbackUrl,
          },
          {
            text: "Log in with Telegram",
          },
        )

        // Override the button click to use our custom handler
        const buttonElement = telegramButtonRef.current.querySelector("button")
        if (buttonElement) {
          // Remove existing event listeners
          const newButton = buttonElement.cloneNode(true)
          buttonElement.parentNode?.replaceChild(newButton, buttonElement)

          // Add our custom handler
          newButton.addEventListener("click", (e) => {
            e.preventDefault()
            handleTelegramAuth()
          })
        }
      }
    }

    // Initialize if Telegram SDK is already loaded
    if (typeof window.Telegram !== "undefined") {
      initTelegramPassport()
    } else {
      // Set up event listener for when the SDK loads
      window.addEventListener("telegram-passport-sdk-loaded", initTelegramPassport)
    }

    return () => {
      window.removeEventListener("telegram-passport-sdk-loaded", initTelegramPassport)
    }
  }, [login_challenge, phone, nonce])

  return (
    <div className="flex flex-col items-center">
      <Script
        src="/telegram-passport.js"
        onLoad={() => {
          // Dispatch custom event when the SDK is loaded
          window.dispatchEvent(new Event("telegram-passport-sdk-loaded"))
        }}
      />

      {/* <p className="mb-4 text-center">
        Click the button below to authenticate with Telegram Passport
      </p> */}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
          <button
            className="ml-2 text-red-700 font-bold"
            onClick={() => {
              setError(null)
              setLoading(false)
              checkAuthStatus()
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin mb-4"></div>
          <p>Waiting for Telegram authentication...</p>
        </div>
      ) : (
        <div ref={telegramButtonRef} id="telegram-passport-auth" className="mb-6"></div>
      )}

      <div className="flex flex-col space-y-2 w-full">
        <SecondaryButton onClick={handleCancel} className="w-full">
          Cancel
        </SecondaryButton>
      </div>

      {/* <p className="mt-4 text-sm text-gray-500">
        After authorizing in Telegram, you will be automatically logged in
      </p> */}
    </div>
  )
}

// Add TypeScript interface for Telegram global object
declare global {
  interface Window {
    Telegram?: {
      Passport: {
        auth: (
          options: {
            bot_id: number
            scope: {
              data: string[]
              v: number
            }
            public_key: string
            nonce: string
            callback_url?: string
          },
          tooltipToggle?: (show: boolean) => void,
        ) => void
        createAuthButton: (
          element: string | HTMLElement,
          options: {
            bot_id: number
            scope: {
              data: string[]
              v: number
            }
            public_key: string
            nonce: string
            callback_url?: string
          },
          buttonOptions?: {
            text?: string
            radius?: number
            tooltip_text?: string
            tooltip_force?: boolean
            tooltip_position?: "top" | "bottom" | "left" | "right"
          },
        ) => void
      }
    }
  }
}

export default TelegramAuthForm
