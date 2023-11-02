"use client"

import { Box, Button, Modal, ModalClose, Sheet, Typography } from "@mui/joy"
import AddIcon from "@mui/icons-material/Add"
import { useState } from "react"

const ApiKeyCreate = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outlined" color="primary">
        {<AddIcon />}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 600,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "flex-start",
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
            <Typography
              component="h2"
              id="modal-title"
              level="h4"
              textColor="inherit"
              fontWeight="lg"
            >
              Create API Key
            </Typography>
          </Box>
          <Typography id="modal-desc" textColor="text.tertiary" textAlign="left">
            Create an API Key to use with your Blink Account.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={async () => {
              setOpen(false)
            }}
            sx={{
              width: "100%",
            }}
          >
            Create
          </Button>
        </Sheet>
      </Modal>
    </>
  )
}

export default ApiKeyCreate
