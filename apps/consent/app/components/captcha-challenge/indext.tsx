"use client"
import React, { memo, useCallback, useEffect, useState } from "react";
import axios from "axios";

interface CaptchaState {
  status: "loading" | "ready" | "success" | "error";
  errorsMessage?: string;
}

const CaptchaChallengeComponent: React.FC<{ phoneNumber: string }> = ({
  phoneNumber,
}) => {
  const [captchaState, setCaptchaState] = useState<CaptchaState>({
    status: "loading",
  });

  const captchaHandler = useCallback(
    (captchaObj: any) => {
      const onSuccess = async () => {
        const result = captchaObj.getValidate();
        try {
          const { data } = await axios.post(
            "http://localhost:4002/phone/code",
            {
              phone: phoneNumber,
              challengeCode: result.geetest_challenge,
              validationCode: result.geetest_validate,
              secCode: result.geetest_seccode,
            }
          );
          const status = data.success ? "success" : "error";
          let errorsMessage;
          if (status === "error") {
            errorsMessage = data.error;
          }
          setCaptchaState({ status, errorsMessage });
        } catch (error) {
          console.error(error);
        }
      };
      captchaObj.appendTo("#captcha");
      captchaObj
        .onReady(() => {
          setCaptchaState({ status: "ready" });
          captchaObj.verify();
        })
        .onSuccess(onSuccess)
        .onError((err: unknown) => {
          console.debug("[Captcha error]:", err);
          setCaptchaState({
            status: "error",
            errorsMessage: "Invalid verification. Please try again",
          });
        });
    },
    [phoneNumber]
  );

  useEffect(() => {
    const initCaptcha = async () => {
      try {
        const { data } = await axios.post(
          "http://localhost:4002/phone/captcha"
        );
        const result = data.result;
        console.log("----", result);
        if (result) {
          const { id, challengeCode, newCaptcha, failbackMode } = result;
          window.initGeetest(
            {
              gt: id,
              challenge: challengeCode,
              offline: failbackMode,
              new_captcha: newCaptcha,
              lang: "en",
              product: "bind",
            },
            captchaHandler
          );
        }
      } catch (error) {
        console.error(error);
      }
    };
    initCaptcha();
  }, [captchaHandler]);

  if (captchaState.status === "success") {
    // Handle success status
  }

  const isLoading = captchaState.status === "loading";
  const hasError = !isLoading && captchaState.status === "error";

  return (
    <div className="captcha-challenge">
      <div className="intro">{"Verify you are human"}</div>
      <div id="captcha">
        {isLoading && <div className="loading">loading</div>}
      </div>
      {hasError && <div className="error">{captchaState.errorsMessage}</div>}
    </div>
  );
};

export const CaptchaChallenge = memo(CaptchaChallengeComponent);
