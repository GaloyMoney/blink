"use client"
import Button from "@mui/joy/Button"
import { Input, FormLabel, FormControl, FormHelperText } from "@mui/joy"
import Modal from "@mui/joy/Modal"
import Box from "@mui/joy/Box"
import ModalClose from "@mui/joy/ModalClose"
import Typography from "@mui/joy/Typography"
import Sheet from "@mui/joy/Sheet"
import { useState } from "react"
import AddIcon from "@mui/icons-material/Add"
import InfoOutlined from "@mui/icons-material/InfoOutlined"

import { useFormStatus, useFormState } from "react-dom"

import Link from "next/link"

import FormSubmitButton from "../form-submit-button"

import { createCallbackAction } from "@/app/callback/server-actions"
import { CallBackAdditionResponse } from "@/app/callback/callback.types"

type Props = {
  callbackPortalUrl: string | undefined
}

function CreateCallBack({ callbackPortalUrl }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const { pending } = useFormStatus()
  const [state, formAction] = useFormState<CallBackAdditionResponse, FormData>(
    createCallbackAction,
    {
      error: false,
      message: null,
      responsePayload: null,
    },
  )

  if (state.message === "success") {
    state.error = false
    state.message = null
    state.responsePayload = null
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
            maxWidth: 400,
            borderRadius: "md",
            p: 3,
            boxShadow: "lg",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "left",
            width: "100%",
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
              width: "100%",
            }}
          >
            <FormControl
              sx={{
                width: "100%",
              }}
              error={state?.error}
            >
              <FormLabel>Callback URL</FormLabel>
              <Input
                required
                data-testid="add-callback-input"
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
            <FormSubmitButton
              data-testid="add-callback-create-btn"
              sx={{
                width: "100%",
              }}
              type="submit"
            >
              Create
            </FormSubmitButton>
          </form>
        </Sheet>
      </Modal>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}
      >
        <Typography id="modal-desc" textColor="text.tertiary" textAlign="left">
          Attach Callback Endpoints
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
          }}
        >
          {callbackPortalUrl && (
            <Link href={callbackPortalUrl} passHref target="_blank">
              <Button>Callback Portal</Button>
            </Link>
          )}
          <Button
            data-testid="add-callback-btn"
            loading={pending}
            onClick={() => setOpen(true)}
          >
            <AddIcon />
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default CreateCallBack
