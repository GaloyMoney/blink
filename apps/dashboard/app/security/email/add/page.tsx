"use client"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"

import { useFormState } from "react-dom"

import {
  Box,
  Button,
  Input,
  FormControl,
  FormHelperText,
  Typography,
  Card,
} from "@mui/joy"
import InfoOutlined from "@mui/icons-material/InfoOutlined"
import Link from "next/link"

import { emailRegisterInitiateServerAction } from "../server-actions"

import { AddEmailResponse } from "../email.types"

import FormSubmitButton from "@/components/form-submit-button"

export default function AddEmail() {
  const [state, formAction] = useFormState<AddEmailResponse, FormData>(
    emailRegisterInitiateServerAction,
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
        <Typography level="h2">Add Your Email Address</Typography>
        <Box>
          <Typography>A verification code was sent to this email.</Typography>
        </Box>
        <FormControl
          sx={{
            width: "90%",
          }}
          error={state.error}
        >
          <form action={formAction}>
            <Input
              data-testid="security-add-email-input"
              name="email"
              type="email"
              sx={{
                padding: "0.6em",
                width: "100%",
              }}
              placeholder="Please Enter Your Email"
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
                flexDirection: "row",
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
                type="submit"
                name="submit"
                data-testid="security-add-email-send-code-btn"
                sx={{
                  marginTop: "1em",
                  display: "flex",
                  gap: "1em",
                  width: "49%",
                }}
              >
                Send Code <ArrowForwardIcon></ArrowForwardIcon>
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
