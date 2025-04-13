"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"
import Script from "next/script"
import { useRouter } from "next/navigation"

import { cancelAuth, telegramAuth } from "./server-actions"

import SecondaryButton from "@/components/button/secondary-button-component"

interface TelegramAuthFormProps {
  login_challenge: string
  phone: string
  authData: {
    bot_id: number
    scope: {
      data: string[]
      v: number
    }
    public_key: string
    nonce: string
    callback_url?: string
  }
}

const TelegramAuthForm: React.FC<TelegramAuthFormProps> = ({
  login_challenge,
  phone,
  authData,
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

  const checkAuthStatus = useCallback(async () => {
    try {
      const result = await telegramAuth(login_challenge, phone, authData.nonce)

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
  }, [login_challenge, phone, authData, router])

  // Handle Telegram auth manually instead of using callback_url
  const handleTelegramAuth = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (typeof window.Telegram !== "undefined") {
      const tooltipToggle = (show: boolean) => {
        if (!show) {
          // When Telegram app is closed/returned, check auth status
          checkAuthStatus()
        }
      }

      try {
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
  }, [authData, checkAuthStatus])

  useEffect(() => {
    const initTelegramPassport = () => {
      if (typeof window.Telegram !== "undefined" && telegramButtonRef.current) {
        window.Telegram.Passport.createAuthButton(telegramButtonRef.current, authData, {
          text: "Log in with Telegram",
        })

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
  }, [login_challenge, phone, authData, handleTelegramAuth])

  useEffect(() => {
    // Expose functions for testing
    window.checkAuthStatus = checkAuthStatus

    return () => {
      delete window.checkAuthStatus
    }
  }, [checkAuthStatus])

  return (
    <div className="flex flex-col items-center">
      <Script
        src="/telegram-passport.js"
        onLoad={() => {
          // Dispatch custom event when the SDK is loaded
          window.dispatchEvent(new Event("telegram-passport-sdk-loaded"))
        }}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
          <button
            className="ml-2 text-red-700 font-bold"
            data-testid="telegram_passport_try_again_btn"
            onClick={() => {
              setError(null)
              setLoading(true)
              checkAuthStatus()
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin mt-4 mb-4"></div>
          <p>
            Waiting for Telegram authentication...
            <button
              className="ml-2 font-semibold text-[var(--primaryButtonBackground)] dark:text-[var(--primaryButtonBackground)] hover:underline"
              data-testid="telegram_passport_refresh_btn"
              onClick={() => {
                setError(null)
                setLoading(true)
                checkAuthStatus()
              }}
            >
              refresh
            </button>
          </p>
        </div>
      ) : (
        !error && (
          <div
            ref={telegramButtonRef}
            id="telegram-passport-auth"
            data-testid="telegram_passport_auth_btn"
            data-testnonce={authData.nonce}
            className="mb-6"
          ></div>
        )
      )}

      <div className="flex flex-col space-y-2 w-full">
        <SecondaryButton onClick={handleCancel} className="w-full">
          Cancel
        </SecondaryButton>
      </div>
    </div>
  )
}

// Add TypeScript interface for Telegram global object
declare global {
  interface Window {
    checkAuthStatus: () => Promise<void>
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
