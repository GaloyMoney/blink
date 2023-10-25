"use client"
import { useState } from "react"
import Button from "@mui/joy/Button"
import Modal from "@mui/joy/Modal"
import ModalClose from "@mui/joy/ModalClose"
import Typography from "@mui/joy/Typography"
import Sheet from "@mui/joy/Sheet"
import DeleteIcon from "@mui/icons-material/Delete"

import { deleteCallbackAction } from "@/app/callback/server-actions"

type CallbackDeleteProps = {
  id: string
}

function DeleteCallback({ id }: CallbackDeleteProps) {
  const [open, setOpen] = useState<boolean>(false)

  const deleteHandler = async () => {
    try {
      await deleteCallbackAction(id)
      setOpen(false)
    } catch (error) {
      console.error(error)
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
            maxWidth: "20em",
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
            display: "flex",
            flexDirection: "column",
            gap: "1em",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <Typography
            component="h2"
            id="modal-callback"
            level="h4"
            textColor="inherit"
            fontWeight="lg"
            mb={1}
          >
            Delete Callback
          </Typography>
          <Typography>Are you sure you want to delete?</Typography>
          <Button onClick={deleteHandler}>Confirm</Button>
        </Sheet>
      </Modal>
      <DeleteIcon sx={{ cursor: "pointer" }} onClick={() => setOpen(true)}></DeleteIcon>
    </>
  )
}

export default DeleteCallback
