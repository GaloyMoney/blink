"use client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import ContentContainer from "@/components/content-container";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
// @ts-ignore-next-line no-implicit-any error
import { experimental_useFormState as useFormState } from "react-dom";
import { emailRegisterInitiateServerAction } from "../../server-actions";

import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Card,
  Typography,
  Link as MuiLink,
} from "@mui/joy";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { CheckBox } from "@mui/icons-material";
import Link from "next/link";
export default function AddEmail() {
  const [state, formAction] = useFormState(emailRegisterInitiateServerAction, {
    error: null,
    message: null,
    responsePayload: {},
  });

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
        <Typography level="h3">Add Email Address</Typography>
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
                Opps! something is wrong.
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
                type="submit"
                name="submit"
                sx={{
                  marginTop: "2em",
                  display: "flex",
                  gap: "1em",
                  backgroundColor: "orange",
                  color: "black",
                }}
              >
                Send Code <ArrowForwardIcon></ArrowForwardIcon>
              </Button>
            </Box>
          </form>
        </FormControl>
      </Card>
    </main>
  );
}
