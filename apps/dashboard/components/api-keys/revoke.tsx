"use client"
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded"
import { Box, Button, Modal, ModalClose, Sheet, Typography } from "@mui/joy"
import React, { useState } from "react"
import { useRouter } from "next/navigation"

import { revokeApiKeyServerAction } from "@/app/api-keys/server-actions"

type Props = {
  id: string
}

const RevokeKey = ({ id }: Props) => {
  const router = useRouter()
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outlined" color="danger">
        <Typography>Revoke</Typography>
      </Button>
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
              Revoke API Key
            </Typography>
          </Box>

          <Typography id="modal-desc" textColor="text.tertiary" textAlign="center">
            You will no longer be able to authenticate with this API Key.
          </Typography>

          <Box
            sx={{
              backgroundColor: "neutral.solidDisabledBg",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              padding: "0.6em",
              borderRadius: "0.5em",
            }}
          >
            <Typography
              fontSize={13}
              id="modal-desc-2"
              textColor="text.tertiary"
              textAlign="left"
            >
              ID :
            </Typography>
            <Typography
              fontSize={13}
              id="modal-desc-2"
              textColor="text.tertiary"
              textAlign="left"
            >
              {id}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="danger"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              await revokeApiKeyServerAction(id)
              setLoading(false)
              setOpen(false)
              router.refresh()
            }}
            sx={{
              width: "100%",
            }}
          >
            Revoke
          </Button>
        </Sheet>
      </Modal>
    </>
  )
}

export default RevokeKey
