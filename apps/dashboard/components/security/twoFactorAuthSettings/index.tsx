"use client"
import { Button, Typography, Box, Modal, Sheet, ModalClose } from "@mui/joy"
import DeleteIcon from "@mui/icons-material/Delete"
import Link from "next/link"
import { useState } from "react"
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded"

import LockOpenIcon from "@mui/icons-material/LockOpen"

import { deleteTotpServerAction } from "@/app/security/2fa/server-actions"

type twoFactorAuthSettingsProps = {
  totpEnabled: boolean | undefined
}

function TwoFactorAuthSettings({ totpEnabled }: twoFactorAuthSettingsProps) {
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)

  if (totpEnabled === undefined) {
    return null
  }

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
              Remove 2FA Address
            </Typography>
          </Box>
          <Typography id="modal-desc" textColor="text.tertiary" textAlign="center">
            Are you sure you want to remove 2FA from your account?
          </Typography>
          <Button
            variant="outlined"
            loading={loading}
            color="danger"
            onClick={async () => {
              setLoading(true)
              await deleteTotpServerAction()
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
            <LockOpenIcon
              sx={{
                fontSize: "2rem",
              }}
            />
            <Typography level="h3">Two Factor Authentication</Typography>
          </Box>
          <Typography>Use 2FA code to login in your Account.</Typography>
        </Box>

        <Box>
          {totpEnabled ? (
            <Link href={""}>
              <Button onClick={() => setOpen(true)} variant="outlined" color="danger">
                {<DeleteIcon />}
              </Button>
            </Link>
          ) : (
            <Link href={"/security/2fa/add"}>
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

export default TwoFactorAuthSettings
