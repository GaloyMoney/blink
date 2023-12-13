"use client"

import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import { useFormState } from "react-dom"
import CopyIcon from "@mui/icons-material/CopyAll"

import {
  Box,
  Button,
  Input,
  FormControl,
  FormHelperText,
  Typography,
  Tooltip,
  Card,
} from "@mui/joy"
import InfoOutlined from "@mui/icons-material/InfoOutlined"
import Link from "next/link"

import { QRCode } from "react-qrcode-logo"

import { useState } from "react"

import { totpRegisterValidateServerAction } from "../server-actions"

import { TotpValidateResponse } from "../totp.types"

import FormSubmitButton from "@/components/form-submit-button"

type VerifyTwoFactorAuth = {
  totpRegistrationId: string
  totpSecret: string
  totpIdentifier: string
}

const AuthenticatorQRCode = ({
  account,
  secret,
}: {
  account: string
  secret: string
}) => {
  return `otpauth://totp/Blink:${account}?secret=${secret}&issuer=Blink`
}

export default function VerifyTwoFactorAuth({
  totpRegistrationId,
  totpSecret,
  totpIdentifier,
}: VerifyTwoFactorAuth) {
  const [copied, setCopied] = useState(false)
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
            Authenticator Secret Key
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              columnGap: 2,
              backgroundColor: "neutral.solidDisabledBg",
              padding: "0.6em",
              borderRadius: "0.5em",
            }}
          >
            <Typography
              sx={{
                width: "100%",
                textAlign: "center",
              }}
              fontFamily="monospace"
            >
              {totpSecret}
            </Typography>
            <Tooltip
              sx={{ cursor: "pointer" }}
              title="Copied to Clipboard"
              variant="plain"
              open={copied}
              onClick={() => {
                setCopied(true)
                setTimeout(() => {
                  setCopied(false)
                }, 2000)
                navigator.clipboard.writeText(totpSecret ?? "")
              }}
            >
              <CopyIcon />
            </Tooltip>
          </Box>
        </Box>

        <Box>
          <QRCode
            size={300}
            value={AuthenticatorQRCode({
              account: totpIdentifier,
              secret: totpSecret,
            })}
          />
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
        <Card>
          To enable two-factor authentication (2FA), add the secret key to your
          Authenticator App manually or use the app to scan the provided QR code. Once
          added, enter the code generated by the Authenticator App to complete the setup.
        </Card>
      </Box>
    </main>
  )
}
