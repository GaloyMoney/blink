"use client"

import ArrowForwardIcon from "@mui/icons-material/ArrowForward"

import {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line no-implicit-any error
  experimental_useFormStatus as useFormStatus,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line no-implicit-any error
  experimental_useFormState as useFormState,
} from "react-dom"

import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Card,
  Typography,
} from "@mui/joy"
import InfoOutlined from "@mui/icons-material/InfoOutlined"
import Link from "next/link"

import { emailRegisterInitiateServerAction } from "../../server-actions"

export default function AddEmail() {
  const [state, formAction] = useFormState(emailRegisterInitiateServerAction, {
    error: null,
    message: null,
    responsePayload: {},
  })
  const { pending } = useFormStatus()
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "4em",
      }}
    >
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "30em",
          gap: "1em",
        }}
      >
        <Typography level="h4">Add Email Address</Typography>

        <FormControl
          sx={{
            width: "90%",
          }}
          error={state.error}
        >
          <form action={formAction}>
            <FormLabel>Email</FormLabel>
            <Input
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
                Oops! something is wrong.
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
              <Link href={"/security"}> Cancel</Link>
              <Button
                loading={pending}
                type="submit"
                name="submit"
                sx={{
                  marginTop: "2em",
                  display: "flex",
                  gap: "1em",
                }}
              >
                Send Code <ArrowForwardIcon></ArrowForwardIcon>
              </Button>
            </Box>
          </form>
        </FormControl>
      </Card>
    </main>
  )
}
