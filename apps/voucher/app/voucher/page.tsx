"use client"
import React, { useEffect, useState } from "react"

import { useRouter } from "next/navigation"

import styles from "./VoucherPage.module.css"

import Heading from "@/components/Heading"

import Button from "@/components/Button/Button"

import ModalComponent from "@/components/ModalComponent"
import LoadingPageComponent from "@/components/Loading/PageLoadingComponent"
import { useGetWithdrawLinkQuery } from "@/lib/graphql/generated"
interface SecretCode {
  input1: string
  input2: string
  input3: string
}

export default function VoucherPage() {
  const router = useRouter()
  const [secret, setSecret] = useState<string>("")
  const [inputs, setInputs] = useState<SecretCode>({
    input1: "",
    input2: "",
    input3: "",
  })
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const { loading, error, data } = useGetWithdrawLinkQuery({
    variables: { voucherSecret: secret },
    context: {
      endpoint: "SELF",
    },
    skip: secret.length !== 12,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = () => {
    setSecret(inputs.input1 + inputs.input2 + inputs.input3)
  }

  useEffect(() => {
    if (data?.getWithdrawLink?.id) {
      router.push(`/withdraw/${data?.getWithdrawLink.voucherSecret}`)
    } else if (data?.getWithdrawLink === null || error) {
      setInputs({
        input1: "",
        input2: "",
        input3: "",
      })
      setModalOpen(true)
    }
  }, [data])

  if (loading) {
    return <LoadingPageComponent />
  }

  return (
    <div className="top_page_container">
      <ModalComponent open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className={styles.modal_container}>
          <p>Invalid Code</p>
          <Button
            style={{
              width: "8em",
            }}
            onClick={() => setModalOpen(false)}
          >
            Ok
          </Button>
        </div>
      </ModalComponent>

      <Heading>Please Enter the 12 digit Code to Redeem Voucher</Heading>

      <div className={styles.voucher_container}>
        <input
          maxLength={4}
          className={styles.voucher_input}
          name="input1"
          onChange={handleInputChange}
          value={inputs.input1}
        ></input>
        <input
          maxLength={4}
          className={styles.voucher_input}
          name="input2"
          onChange={handleInputChange}
          value={inputs.input2}
        ></input>
        <input
          maxLength={4}
          className={styles.voucher_input}
          name="input3"
          onChange={handleInputChange}
          value={inputs.input3}
        ></input>
      </div>
      <Button
        style={{
          width: "16em",
        }}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </div>
  )
}
