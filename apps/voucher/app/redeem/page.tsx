"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import LoadingPageComponent from "@/components/loading/page-loading-component"
import { useGetWithdrawLinkQuery } from "@/lib/graphql/generated"

interface SecretCode {
  input1: string
  input2: string
  input3: string
}

export default function VoucherPage() {
  const router = useRouter()
  const [secret, setSecret] = useState("")
  const [inputs, setInputs] = useState<SecretCode>({
    input1: "",
    input2: "",
    input3: "",
  })
  const [modalOpen, setModalOpen] = useState(false)
  const { loading, error, data } = useGetWithdrawLinkQuery({
    variables: { voucherSecret: secret },
    context: { endpoint: "SELF" },
    skip: secret.length !== 12,
  })

  useEffect(() => {
    if (data?.getWithdrawLink?.id) {
      router.push(`/withdraw/${data.getWithdrawLink.voucherSecret}`)
    } else if (data?.getWithdrawLink === null || error) {
      setInputs({ input1: "", input2: "", input3: "" })
      setModalOpen(true)
    }
  }, [data, error, router])

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData("text").slice(0, 12)
    if (pasteData.length === 12) {
      const parts = {
        input1: pasteData.substring(0, 4),
        input2: pasteData.substring(4, 8),
        input3: pasteData.substring(8, 12),
      }
      setInputs(parts)
      setSecret(pasteData)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const fieldIndex = parseInt(name.charAt(5))

    setInputs((prevState) => ({
      ...prevState,
      [name]: value,
    }))

    if (value.length === 4 && fieldIndex < 3) {
      const nextSibling = document.querySelector(
        `input[name='input${fieldIndex + 1}']`,
      ) as HTMLInputElement
      nextSibling?.focus()
    } else if (value.length === 0 && fieldIndex > 1) {
      const previousSibling = document.querySelector(
        `input[name='input${fieldIndex - 1}']`,
      ) as HTMLInputElement
      previousSibling?.focus()
    }
  }

  const handleSubmit = () => {
    setSecret(inputs.input1 + inputs.input2 + inputs.input3)
  }

  if (loading) {
    return <LoadingPageComponent />
  }

  return (
    <div className="top_page_container">
      <ModalComponent open={modalOpen} onClose={() => setModalOpen(false)}>
        <div>
          <p>Invalid Code</p>
          <Button style={{ width: "8em" }} onClick={() => setModalOpen(false)}>
            Ok
          </Button>
        </div>
      </ModalComponent>

      <p className="text-center text-md font-semibold text-slate-900 mt-10 mb-2">
        Enter 12-digit Code Redeem Code
      </p>
      <div className="flex flex-row gap-3 max-w-xs w-full justify-center">
        <InputCode
          name="input1"
          value={inputs.input1}
          onChange={handleInputChange}
          onPaste={handlePaste}
        />
        <InputCode
          name="input2"
          value={inputs.input2}
          onChange={handleInputChange}
          onPaste={handlePaste}
        />
        <InputCode
          name="input3"
          value={inputs.input3}
          onChange={handleInputChange}
          onPaste={handlePaste}
        />
      </div>
      <Button className="w-36 mt-4" onClick={handleSubmit}>
        Redeem
      </Button>
    </div>
  )
}

const InputCode = ({
  name,
  value,
  onChange,
  onPaste,
}: {
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void
}) => {
  return (
    <input
      type="text"
      maxLength={4}
      name={name}
      className="bg-secondary p-3 w-1/3 rounded-lg font-bold text-xl text-center"
      onChange={onChange}
      onPaste={onPaste}
      value={value}
    />
  )
}
