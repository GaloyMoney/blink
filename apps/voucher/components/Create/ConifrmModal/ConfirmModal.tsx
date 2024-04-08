import React, { useState, MouseEvent } from "react"

import styles from "./ConfirmModal.module.css"

import Button from "@/components/Button/Button"
import ModalComponent from "@/components/ModalComponent"
import { formatOperand } from "@/utils/helpers"
import { Currency, useCreateWithdrawLinkMutation, Wallet } from "@/lib/graphql/generated"
import { useRouter } from "next/navigation"
import LoadingComponent from "@/components/Loading/LoadingComponent"
import { useSession } from "next-auth/react"

type Props = {
  open: boolean
  onClose: (currency: MouseEvent<HTMLButtonElement>) => void
  amount: string
  currency: Currency
  commissionPercentage: string
  voucherAmountInDollars: number
  btcWallet: Wallet
  usdWallet: Wallet
}

const ConfirmModal = ({
  open,
  onClose,
  amount,
  currency,
  commissionPercentage,
  voucherAmountInDollars,
  btcWallet,
  usdWallet,
}: Props) => {
  const [selectedWalletId, setSelectedWalletId] = useState("")
  const [modalLoading, setModalLoading] = useState<boolean>(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [formIsValid, setFormIsValid] = useState(false)
  const { update } = useSession()
  const [createWithdrawLink, { loading: withdrawLinkLoading, error: withdrawLinkError }] =
    useCreateWithdrawLinkMutation()
  const router = useRouter()

  const handleSubmit = async ({
    voucherAmountInCents,
    commissionPercentage,
    walletId,
  }: {
    voucherAmountInCents: number
    commissionPercentage: number
    walletId: string
  }) => {
    setModalLoading(true)
    try {
      const createWithdrawLinkResult = await createWithdrawLink({
        variables: {
          input: {
            voucherAmountInCents,
            commissionPercentage,
            walletId,
          },
        },
      })
      update()

      if (createWithdrawLinkResult.errors) {
        setModalError(createWithdrawLinkResult.errors[0].message)
        return
      }

      router.push(
        `/withdraw/${createWithdrawLinkResult.data?.createWithdrawLink.voucherSecret}/lnurl`,
      )
    } catch (err) {
      if (err instanceof Error) {
        setModalError(err.message)
      }
      setModalLoading(false)
      console.log("error in creating invoice at create page", err)
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    const isValid = selected !== "default"
    setSelectedWalletId(selected === "btc" ? btcWallet.id : usdWallet.id)
    setFormIsValid(isValid)
  }

  if (modalLoading || withdrawLinkLoading) {
    return (
      <ModalComponent
        open={open}
        onClose={() => {
          onClose
        }}
      >
        <div className={styles.modal_container}>
          <LoadingComponent />
        </div>
      </ModalComponent>
    )
  }

  return (
    <ModalComponent open={open} onClose={onClose}>
      <div className={styles.modal_container}>
        {modalError ? (
          <>
            <h1 className={styles.modalTitle}>Error</h1>
            <div
              style={{
                justifyContent: "center",
                display: "flex",
                margin: "auto",
                flexDirection: "column",
                gap: "1em",
              }}
            >
              <p className={styles.modalText}>{modalError}</p>
              <div className={styles.button_container}>
                <Button
                  onClick={() => {
                    setModalError(null)
                  }}
                >
                  Okay
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className={styles.modalTitle}>Confirm</h1>
            <div>
              <h3 className={styles.modalSubtitle}>Sales Amount </h3>
              <p className={styles.modalText}>
                {formatOperand(Number(amount).toFixed(currency.fractionDigits))}{" "}
                {currency.name}
              </p>
            </div>
            <div>
              <h3 className={styles.modalSubtitle}>Voucher Amount</h3>
              <p className={styles.modalText}>
                {Number(voucherAmountInDollars)} US Dollar
              </p>
            </div>

            <div>
              <h3 className={styles.modalSubtitle}>Sales Commission</h3>
              <p className={styles.modalText}>{Number(commissionPercentage)}%</p>
            </div>

            <div>
              <h3 className={styles.modalSubtitle}>Paying Wallet</h3>
              <select
                name=""
                id=""
                defaultValue="default"
                required={true}
                onChange={handleSelectChange}
              >
                <option value="default" disabled>
                  Select Wallet
                </option>
                <option value="btc">
                  <div>BTC Wallet</div>
                  <div> {btcWallet.balance} sats</div>
                </option>
                <option value="usd" className="flex flex-col p-1">
                  <div>USD Wallet</div>
                  <div> ${usdWallet.balance / 100} USD</div>
                </option>
              </select>
            </div>

            <div className={styles.button_container}>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                disabled={!formIsValid}
                onClick={() =>
                  handleSubmit({
                    voucherAmountInCents: Number(
                      (Number(voucherAmountInDollars) * 100).toFixed(),
                    ),
                    commissionPercentage: Number(commissionPercentage),
                    walletId: selectedWalletId,
                  })
                }
              >
                Pay
              </Button>
            </div>
          </>
        )}
      </div>
    </ModalComponent>
  )
}

export default ConfirmModal
