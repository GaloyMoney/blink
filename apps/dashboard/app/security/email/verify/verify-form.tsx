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

import { emailRegisterValidateServerAction } from "../../server-actions"

type VerifyEmailFormProps = {
  emailRegistrationId: string
}
export default function VerifyEmailForm({ emailRegistrationId }: VerifyEmailFormProps) {
  const { pending } = useFormStatus()

  const [state, formAction] = useFormState(emailRegisterValidateServerAction, {
    error: null,
    message: null,
    responsePayload: {},
  })

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
        }}
      >
        <Typography level="h3">Verification Code</Typography>
        <FormControl
          sx={{
            width: "90%",
          }}
          error={state.error}
        >
          <form action={formAction}>
            <FormLabel>Code</FormLabel>
            <input type="hidden" name="emailRegistrationId" value={emailRegistrationId} />
            <Input
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
                {state.message.message}
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
              <Link href={"/security"}>Cancel</Link>
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
                Confirm <ArrowForwardIcon></ArrowForwardIcon>
              </Button>
            </Box>
          </form>
        </FormControl>
      </Card>
    </main>
  )
}
