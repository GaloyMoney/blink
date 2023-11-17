"use client"
import { useState } from "react"
import { Button, Typography, Box, Modal, Sheet, ModalClose } from "@mui/joy"

import DeleteIcon from "@mui/icons-material/Delete"
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded"

import { deleteCallbackAction } from "@/app/callback/server-actions"

type CallbackDeleteProps = {
  id: string
}

function DeleteCallback({ id }: CallbackDeleteProps) {
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)

  const deleteHandler = async () => {
    try {
      setLoading(true)
      await deleteCallbackAction(id)
      setOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
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
              id="modal-callback"
              level="h4"
              textColor="inherit"
              fontWeight="lg"
            >
              Delete Callback
            </Typography>
          </Box>
          <Typography id="modal-desc" textColor="text.tertiary" textAlign="center">
            Are you sure you want to delete? You will not be able to use this callback
            further.
          </Typography>
          <Button
            data-testid={`delete-callback-confirm-btn-${id}`}
            variant="outlined"
            loading={loading}
            color="danger"
            onClick={deleteHandler}
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
          alignItems: "right",
        }}
      >
        <Button
          data-testid={`delete-callback-btn-${id}`}
          onClick={() => setOpen(true)}
          variant="outlined"
          color="danger"
        >
          <DeleteIcon />
          <Typography
            sx={{
              display: {
                xs: "block",
                md: "none",
              },
            }}
          >
            Remove
          </Typography>
        </Button>
      </Box>
    </>
  )
}

export default DeleteCallback
