"use client"
import { Button, Typography, Box, Modal, Sheet, ModalClose } from "@mui/joy"
import DeleteIcon from "@mui/icons-material/Delete"
import Link from "next/link"
import { useState } from "react"
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded"

import MailRoundedIcon from "@mui/icons-material/MailRounded"

import { deleteEmailServerAction } from "@/app/security/email/server-actions"

type EmailDataProps = {
  readonly __typename: "Email"
  readonly address?: string | null | undefined
  readonly verified?: boolean | null | undefined
}

type EmailSettingsProps = {
  emailData: EmailDataProps
}

function EmailSettings({ emailData }: EmailSettingsProps) {
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  return (
    <>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 400,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
          }}
        >
          <ModalClose variant="plain" sx={{ alignSelf: "flex-end" }} />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <ReportProblemRoundedIcon
              sx={{
                fontSize: "4rem",
              }}
            />
            <Typography
              component="h2"
              id="modal-title"
              level="h4"
              textColor="inherit"
              fontWeight="lg"
            >
              Remove Email Address
            </Typography>
          </Box>
          <Typography id="modal-desc" textColor="text.tertiary" textAlign="center">
            Are you sure you want to remove this email from your account? You will not be
            able to log in with this email again.
          </Typography>
          <Button
            variant="outlined"
            loading={loading}
            color="danger"
            onClick={async () => {
              setLoading(true)
              await deleteEmailServerAction()
              setOpen(false)
            }}
            sx={{
              width: "100%",
            }}
          >
            Confirm
          </Button>
        </Sheet>
      </Modal>

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
            <MailRoundedIcon
              sx={{
                fontSize: "2rem",
              }}
            />
            <Typography level="h3">Email</Typography>
          </Box>
          <Typography>Use email to login in your Account.</Typography>
          <Box
            data-testid="security-add-email-address"
            sx={{
              display: { xs: "block", md: "none" },
            }}
          >
            <Typography>{emailData?.address}</Typography>
          </Box>
        </Box>

        <Box
          data-testid="security-add-email-verification-code-confirm-btn"
          sx={{
            display: { xs: "none", md: "block" },
          }}
        >
          <Typography>{emailData?.address}</Typography>
        </Box>

        <Box>
          {emailData?.verified ? (
            <Link href={""}>
              <Button onClick={() => setOpen(true)} variant="outlined" color="danger">
                {<DeleteIcon />}
              </Button>
            </Link>
          ) : emailData?.address ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5em",
              }}
            >
              <Link href={"/security/email/verify"}>
                <Button variant="outlined" color="success">
                  Verify
                </Button>
              </Link>
              <Button onClick={() => setOpen(true)} variant="outlined" color="danger">
                {<DeleteIcon />}
              </Button>
            </Box>
          ) : (
            <Link href={"/security/email/add"}>
              <Button
                data-testid="security-add-email-btn"
                variant="outlined"
                color="primary"
              >
                Add
              </Button>
            </Link>
          )}
        </Box>
      </Box>
    </>
  )
}

export default EmailSettings
