"use client"
import Button from "@mui/joy/Button"
import { Input, FormLabel, FormControl, FormHelperText } from "@mui/joy"
import Modal from "@mui/joy/Modal"
import ModalClose from "@mui/joy/ModalClose"
import Typography from "@mui/joy/Typography"
import Sheet from "@mui/joy/Sheet"
import { useState } from "react"
import AddIcon from "@mui/icons-material/Add"
import InfoOutlined from "@mui/icons-material/InfoOutlined"

import {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  experimental_useFormStatus as useFormStatus,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  experimental_useFormState as useFormState,
} from "react-dom"

import { createCallbackAction } from "@/app/callback/server-actions"

function CreateCallBack() {
  const [open, setOpen] = useState<boolean>(false)
  const { pending } = useFormStatus()
  const [state, formAction] = useFormState(createCallbackAction, {
    error: false,
    message: null,
    responsePayload: null,
  })

  if (state.message === "success") {
    state.message = null
    setOpen(false)
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
            Create Callback
          </Typography>
          <form
            action={formAction}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1em",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FormControl error={state?.error}>
              <FormLabel>Callback URL</FormLabel>
              <Input
                required
                placeholder="Enter the Callback URL"
                type="url"
                name="callBackUrl"
                id="callBackUrl"
              />
              {state?.error ? (
                <FormHelperText>
                  <InfoOutlined />
                  {state?.message}
                </FormHelperText>
              ) : null}
            </FormControl>
            <Button
              sx={{
                width: "100%",
              }}
              loading={pending}
              type="submit"
            >
              Create
            </Button>
          </form>
        </Sheet>
      </Modal>
      <Button
        loading={pending}
        sx={{
          width: "10em",
        }}
        onClick={() => setOpen(true)}
      >
        Add Callback <AddIcon></AddIcon>
      </Button>
    </>
  )
}

export default CreateCallBack
