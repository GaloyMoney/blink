"use client"
import { Button, Typography, Box } from "@mui/joy"
import MailOutlineIcon from "@mui/icons-material/MailOutline"
import DeleteIcon from "@mui/icons-material/Delete"
import Link from "next/link"

type EmailDataProps = {
  readonly __typename: "Email"
  readonly address?: string | null | undefined
  readonly verified?: boolean | null | undefined
}

type EmailSettingsProps = {
  emailData: EmailDataProps
}

function EmailSettings({ emailData }: EmailSettingsProps) {
  return (
    <Box
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
          <MailOutlineIcon
            sx={{
              fontSize: "1.8rem",
            }}
          />
          <Typography level="h4">Email</Typography>
        </Box>
        <Typography>Use email to login in your Account </Typography>
        <Box
          sx={{
            display: { xs: "block", md: "none" },
          }}
        >
          <Typography>{emailData?.address}</Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: "none", md: "block" },
        }}
      >
        <Typography>{emailData?.address}</Typography>
      </Box>

      <Box>
        {emailData?.verified ? (
          <Link href={""}>
            <Button variant="outlined" color="danger">
              {<DeleteIcon />}
            </Button>
          </Link>
        ) : emailData?.address ? (
          <Link href={"/security/email/verify"}>
            <Button variant="outlined" color="success">
              Verify
            </Button>
          </Link>
        ) : (
          <Link href={"/security/email/add"}>
            <Button variant="outlined" color="primary">
              Add
            </Button>
          </Link>
        )}
      </Box>
    </Box>
  )
}

export default EmailSettings
