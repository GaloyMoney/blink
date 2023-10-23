import React, { useState } from "react";
import { Button, Typography, Card } from "@mui/joy";
import { Box } from "@mui/joy";
import EmailIcon from "@mui/icons-material/Email";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";

type EmailDataProps = {
  readonly __typename: "Email";
  readonly address?: string | null | undefined;
  readonly verified?: boolean | null | undefined;
};

function EmailSettings(emailData: EmailDataProps) {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        width: "90%",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "1em",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: "0.5em",
          }}
        >
          <EmailIcon />
          <Typography>Email</Typography>
        </Box>
        <Typography>Use email to login in your Account</Typography>
      </Box>

      <Box>
        <Typography>{emailData?.address}</Typography>
      </Box>

      <Box>
        {emailData?.verified ? (
          <Link href={""}>
            <Button color="danger">{<DeleteIcon />}</Button>
          </Link>
        ) : emailData?.address ? (
          <Link href={"/security/email/verify"}>
            <Button color="success">Verify</Button>
          </Link>
        ) : (
          <Link href={"/security/email/add"}>
            <Button color="primary">Add</Button>
          </Link>
        )}
      </Box>
    </Card>
  );
}

export default EmailSettings;
