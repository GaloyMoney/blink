import React, { useState, MouseEvent, useEffect } from "react"

import { useRouter } from "next/navigation"

import { useSession } from "next-auth/react"

import styles from "./confirm-modal.module.css"

import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import { calculateAmountAfterCommission, WalletDetails } from "@/utils/helpers"
import {
  useCreateWithdrawLinkMutation,
  useCurrencyConversionEstimationQuery,
} from "@/lib/graphql/generated"
import LoadingComponent from "@/components/loading/loading-component"
import { formatCurrency } from "@/lib/utils"

type Props = {
  open: boolean
  onClose: (currency: MouseEvent<HTMLButtonElement>) => void
  amount: string
  currency: string
  commissionPercentage: string
  btcWallet: WalletDetails
  usdWallet: WalletDetails
}

const calculateProfitAmount = ({
  amount,
  commissionRatePercentage,
}: {
  amount: number
  commissionRatePercentage: number
}) => {
  return (amount * commissionRatePercentage) / 100
}

const ConfirmModal = ({
  open,
  onClose,
  amount,
  currency,
  commissionPercentage,
  btcWallet,
  usdWallet,
}: Props) => {
  const router = useRouter()
  const { update } = useSession()

  const [selectedWalletId, setSelectedWalletId] = useState("")
  const [modalLoading, setModalLoading] = useState<boolean>(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [formIsValid, setFormIsValid] = useState(false)

  const [createWithdrawLink, { loading: withdrawLinkLoading }] =
    useCreateWithdrawLinkMutation()

  const { data: currencyConversion, refetch } = useCurrencyConversionEstimationQuery({
    variables: { amount: Number(amount), currency },
    context: { endpoint: "GALOY" },
    pollInterval: 60000,
  })

  const { data: currencyDataForOneUnit } = useCurrencyConversionEstimationQuery({
    variables: { amount: 1, currency },
    context: { endpoint: "GALOY" },
  })

  useEffect(() => {
    refetch({ amount: Number(amount), currency })
  }, [amount, currency, refetch])

  const usdToCurrencyRate = Number(
    currencyDataForOneUnit?.currencyConversionEstimation.usdCentAmount / 100,
  )
  const profitAmount = calculateProfitAmount({
    amount: Number(amount),
    commissionRatePercentage: Number(commissionPercentage),
  })

  const amountInDollars = Number(
    (currencyConversion?.currencyConversionEstimation.usdCentAmount / 100).toFixed(2),
  )

  const voucherAmountInDollars = calculateAmountAfterCommission({
    amount: amountInDollars,
    commissionRatePercentage: Number(commissionPercentage),
  })

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
        variables: { input: { voucherAmountInCents, commissionPercentage, walletId } },
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
    setSelectedWalletId(selected === "btc" ? btcWallet.id : usdWallet.id)
    setFormIsValid(selected !== "default")
  }

  const renderErrorModal = () => (
    <div className="flex flex-col justify-between gap-4 h-full">
      <h1 className={styles.modalTitle}>Error</h1>
      <div className="text-center mt-0">
        <p className={styles.modalText}>{modalError}</p>
      </div>
      <Button className="w-full" onClick={() => setModalError(null)}>
        Okay
      </Button>
    </div>
  )

  const renderConfirmationModal = () => (
    <>
      <div className="flex justify-between w-full">
        <div>
          <h3 className={styles.modalSubtitle}>Price</h3>
          <p className={styles.modalText}>
            {formatCurrency({ amount: Number(amount), currency })}
          </p>
        </div>
        <div>
          <h3 className={`${styles.modalSubtitle} text-right`}>Value</h3>
          <p className={styles.modalText}>{Number(voucherAmountInDollars)} US Dollar</p>
        </div>
      </div>
      <div className="flex justify-between w-full">
        <div>
          <h3 className={styles.modalSubtitle}>Commission</h3>
          <p className={styles.modalText}>
            {Number(commissionPercentage)}%
            {currency !== "USD" &&
              ` (${formatCurrency({ amount: profitAmount, currency })})`}
          </p>
        </div>
        <div>
          {currency === "USD" ? (
            <>
              <h3 className={`${styles.modalSubtitle} text-right`}>Profit</h3>
              <p className={styles.modalText}>
                {formatCurrency({ amount: profitAmount, currency })} {currency}
              </p>
            </>
          ) : (
            <>
              <h3 className={`${styles.modalSubtitle} text-right`}>Rate</h3>
              <p className={styles.modalText}>
                1 USD = {formatCurrency({ amount: usdToCurrencyRate, currency })}{" "}
                {currency}
              </p>
            </>
          )}
        </div>
      </div>
      <div>
        <h3 className={styles.modalSubtitle}>Paying Wallet</h3>
        <select
          defaultValue="default"
          required
          onChange={handleSelectChange}
          data-testid="wallet-select"
          className="w-full p-2 border rounded-md bg-secondary mt-1"
        >
          <option data-testid="wallet-select-btc" value="btc">
            BTC Wallet - {btcWallet.balance} sats
          </option>
          <option data-testid="wallet-select-usd" value="usd">
            USD Wallet - ${usdWallet.balance / 100} USD
          </option>
        </select>
      </div>
      <div className="flex gap-2 mt-0 flex-col w-full">
        <Button
          className="w-full"
          data-testid="pay-voucher-amount-btn"
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
        <Button
          className="w-full text-primary font-bold p-1"
          variant="link"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </>
  )

  return (
    <ModalComponent open={open} onClose={onClose}>
      <div className={`${styles.modal_container} h-full`}>
        {modalLoading || withdrawLinkLoading ? (
          <LoadingComponent />
        ) : modalError ? (
          renderErrorModal()
        ) : (
          renderConfirmationModal()
        )}
      </div>
    </ModalComponent>
  )
}

export default ConfirmModal
