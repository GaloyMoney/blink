"use client";
import { sendPhoneCode } from "@/app/login/phone/server-actions";
import { memo, useCallback, useEffect } from "react";
import { toast } from "react-toastify";

declare global {
  interface Window {
    initGeetest: (options: any, callback: (captchaObj: any) => void) => void;
  }
}

const CaptchaChallengeComponent: React.FC<{
  id: string;
  challenge: string;
  formData: {
    login_challenge: string;
    phone: string;
    remember: string;
  };
}> = ({ id, challenge, formData }) => {
  
  const sendMockData = async () => {
    const mockCaptchaResult = {
      geetest_challenge: "mockChallenge",
      geetest_validate: "mockValidate",
      geetest_seccode: "mockSecCode",
    };
    const res = await sendPhoneCode(mockCaptchaResult, formData);
    if (res?.error) {
      toast.error(res.message);
    }
  };

  const captchaHandler = useCallback(
    (captchaObj: any) => {
      const onSuccess = async () => {
        const result = captchaObj.getValidate();
        const res = await sendPhoneCode(result, formData);
        if (res?.error) {
          toast.error(res.message);
        }
      };
      captchaObj.appendTo("#captcha");
      captchaObj
        .onReady(() => {
          captchaObj.verify();
        })
        .onSuccess(onSuccess)
        .onError((err: unknown) => {
          console.debug("[Captcha error]:", err);
        });
    },
    [formData]
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      sendMockData();
    } else {
      window.initGeetest(
        {
          gt: id,
          challenge: challenge,
          offline: false,
          new_captcha: true,
          product: "bind",
          lang: "en",
        },
        captchaHandler
      );
    }
  }, [captchaHandler, id, challenge]);

  return <div data-testid="captcha_container" id="captcha"></div>;
};
export const CaptchaChallenge = memo(CaptchaChallengeComponent);
