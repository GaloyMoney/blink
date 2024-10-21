"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@mui/joy"
import AddIcon from "@mui/icons-material/Add"

import ApiKeyModal from "./modal"

import { ApiKeyResponse } from "@/app/api-keys/api-key.types"
import { createApiKeyServerAction } from "@/app/api-keys/server-actions"

type ApiKeyCreateProps = {
  usdWalletId: string | undefined
  btcWalletId: string | undefined
}

const initialState: ApiKeyResponse = {
  error: false,
  message: null,
  responsePayload: null,
}

const ApiKeyCreate = ({ usdWalletId, btcWalletId }: ApiKeyCreateProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ApiKeyResponse>(initialState)

  const handleModalOpen = useCallback(() => {
    setOpen(true)
    setState(initialState)
  }, [])

  const handleModalClose = useCallback(() => {
    setOpen(false)
    setState(initialState)
    router.refresh()
  }, [router])

  const handleFormAction = useCallback(async (formData: FormData) => {
    try {
      const result = await createApiKeyServerAction(formData)
      setState(result)
    } catch (error) {
      setState({
        error: true,
        message: "An error occurred while creating the API key.",
        responsePayload: null,
      })
    }
  }, [])

  return (
    <>
      <Button onClick={handleModalOpen} variant="solid" color="primary">
        <AddIcon data-testid="create-api-add-btn" />
      </Button>
      <ApiKeyModal
        open={open}
        onClose={handleModalClose}
        state={state}
        formAction={handleFormAction}
        usdWalletId={usdWalletId}
        btcWalletId={btcWalletId}
      />
    </>
  )
}

export default ApiKeyCreate
