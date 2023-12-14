"use client"
import { memo, useCallback, useEffect } from "react"

import { toast } from "react-toastify"

import { sendPhoneCode } from "@/app/login/phone/server-actions"
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initGeetest: (options: any, callback: (captchaObj: any) => void) => void
  }
}

const CaptchaChallengeComponent: React.FC<{
  id: string
  challenge: string
  formData: {
    login_challenge: string
    phone: string
    remember: string
    channel: string
  }
}> = ({ id, challenge, formData }) => {
  const captchaHandler = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (captchaObj: any) => {
      const onSuccess = async () => {
        const result = captchaObj.getValidate()
        const res = await sendPhoneCode(result, formData)
        if (res?.error) {
          toast.error(res.message)
        }
      }
      captchaObj.appendTo("#captcha")
      captchaObj
        .onReady(() => {
          captchaObj.verify()
        })
        .onSuccess(onSuccess)
        .onError((err: unknown) => {
          console.debug("[Captcha error]:", err)
        })
    },
    [formData],
  )

  useEffect(() => {
    window.initGeetest(
      {
        gt: id,
        challenge: challenge,
        offline: false,
        new_captcha: true,
        product: "bind",
        lang: "en",
      },
      captchaHandler,
    )
  }, [captchaHandler, id, challenge])

  return <div data-testid="captcha_container" id="captcha"></div>
}
export const CaptchaChallenge = memo(CaptchaChallengeComponent)
