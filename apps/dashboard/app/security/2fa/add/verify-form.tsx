"use client"

import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import { useFormState } from "react-dom"

import { Box, Button, Input, FormControl, FormHelperText, Typography } from "@mui/joy"
import InfoOutlined from "@mui/icons-material/InfoOutlined"
import Link from "next/link"

import { QRCode } from "react-qrcode-logo"

import { totpRegisterValidateServerAction } from "../server-actions"

import { TotpValidateResponse } from "../totp.types"

import FormSubmitButton from "@/components/form-submit-button"

type VerifyTwoFactorAuth = {
  totpRegistrationId: string
  totpSecret: string
}
export default function VerifyTwoFactorAuth({
  totpRegistrationId,
  totpSecret,
}: VerifyTwoFactorAuth) {
  const [state, formAction] = useFormState<TotpValidateResponse, FormData>(
    totpRegisterValidateServerAction,
    {
      error: false,
      message: null,
      responsePayload: null,
    },
  )

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "4em",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "30em",
          gap: "1.5em",
        }}
      >
        <Typography level="h2">Enter 2FA Code</Typography>
        <Box>
          <Typography
            sx={{
              textAlign: "center",
            }}
          >
            Add Secret to your Authenticator App or Scan the QR from the Authenticator
            App.
          </Typography>
          <Typography
            sx={{
              textAlign: "center",
            }}
            level="h4"
          >
            {totpSecret}
          </Typography>
        </Box>

        <Box>
          <QRCode size={300} value={totpSecret} />
        </Box>
        <FormControl
          sx={{
            width: "90%",
          }}
          error={state.error}
        >
          <form action={formAction}>
            <input type="hidden" name="totpRegistrationId" value={totpRegistrationId} />
            <Input
              data-testid="security-add-totp-verification-code-input"
              name="code"
              type="code"
              sx={{
                padding: "0.6em",
                width: "100%",
              }}
              placeholder="Please Enter Authenticator Code"
            />

            {state.error ? (
              <FormHelperText>
                <InfoOutlined />
                {state.message}
              </FormHelperText>
            ) : null}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
              }}
            >
              <Link href={"/security"} style={{ width: "49%" }}>
                <Button
                  type="submit"
                  name="submit"
                  color="danger"
                  variant="outlined"
                  sx={{
                    marginTop: "1em",
                    display: "flex",
                    gap: "1em",
                    width: "100%",
                  }}
                >
                  Cancel
                </Button>
              </Link>
              <FormSubmitButton
                data-testid="security-add-totp-verification-code-confirm-btn"
                type="submit"
                name="submit"
                sx={{
                  marginTop: "1em",
                  display: "flex",
                  gap: "1em",
                  width: "49%",
                }}
              >
                Confirm <ArrowForwardIcon></ArrowForwardIcon>
              </FormSubmitButton>
            </Box>
          </form>
        </FormControl>
      </Box>
    </main>
  )
}
