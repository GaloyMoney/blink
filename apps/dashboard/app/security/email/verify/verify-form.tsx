"use client"

import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import { useFormState } from "react-dom"

import {
  Box,
  Button,
  Input,
  FormControl,
  FormHelperText,
  Card,
  Typography,
} from "@mui/joy"
import InfoOutlined from "@mui/icons-material/InfoOutlined"
import Link from "next/link"

import { emailRegisterValidateServerAction } from "../server-actions"

import { VerifyEmailResponse } from "../email.types"

import FormSubmitButton from "@/components/form-submit-button"

type VerifyEmailFormProps = {
  emailRegistrationId: string
  email: string
}
export default function VerifyEmailForm({
  emailRegistrationId,
  email,
}: VerifyEmailFormProps) {
  const [state, formAction] = useFormState<VerifyEmailResponse, FormData>(
    emailRegisterValidateServerAction,
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
        <Typography level="h2">Email Verification Code</Typography>
        <Box>
          <Typography>Enter the verification code sent to your email.</Typography>
          <Typography
            sx={{
              textAlign: "center",
            }}
            level="h4"
          >
            {email}{" "}
          </Typography>
        </Box>
        <FormControl
          sx={{
            width: "90%",
          }}
          error={state.error}
        >
          <form action={formAction}>
            <input type="hidden" name="emailRegistrationId" value={emailRegistrationId} />
            <Input
              data-testid="security-add-email-verification-code-input"
              name="code"
              type="code"
              sx={{
                padding: "0.6em",
                width: "100%",
              }}
              placeholder="Please Enter Verification Code"
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
                data-testid="security-add-email-verification-code-confirm-btn"
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
        <Card
          sx={{
            width: "90%",
            textAlign: "center",
          }}
        >
          <Typography>This email can be used to log in to your account.</Typography>
        </Card>
      </Box>
    </main>
  )
}
