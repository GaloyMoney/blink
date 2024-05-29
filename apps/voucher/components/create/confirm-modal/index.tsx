import React, { useState, MouseEvent } from "react"

import { useRouter } from "next/navigation"

import { useSession } from "next-auth/react"

import styles from "./confirm-modal.module.css"

import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import { WalletDetails } from "@/utils/helpers"
import {
  useCreateWithdrawLinkMutation,
  useCurrencyConversionEstimationQuery,
} from "@/lib/graphql/generated"
import LoadingComponent from "@/components/loading/loading-component"
import { convertPpmToPercentage, formatCurrency } from "@/lib/utils"
import { amountCalculator } from "@/lib/amount-calculator"

type Props = {
  open: boolean
  onClose: (currency: MouseEvent<HTMLButtonElement>) => void
  voucherPrice: string
  currency: string
  commissionPercentage: string
  btcWallet: WalletDetails
  usdWallet: WalletDetails
  platformFeesInPpm: number
  voucherAmountInDollars: number
  voucherPriceInCents: number
}

const ConfirmModal = ({
  open,
  onClose,
  voucherPrice,
  currency,
  commissionPercentage,
  btcWallet,
  usdWallet,
  platformFeesInPpm,
  voucherAmountInDollars,
  voucherPriceInCents,
}: Props) => {
  const router = useRouter()
  const { update } = useSession()

  const [selectedWalletId, setSelectedWalletId] = useState(btcWallet.id)
  const [modalLoading, setModalLoading] = useState<boolean>(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const [createWithdrawLink, { loading: withdrawLinkLoading }] =
    useCreateWithdrawLinkMutation()

  const { data: currencyDataForOneUnit } = useCurrencyConversionEstimationQuery({
    variables: { amount: 1, currency },
    context: { endpoint: "GALOY" },
  })

  const profitAmount = amountCalculator.profitAmount({
    voucherPrice: Number(voucherPrice),
    commissionPercentage: Number(commissionPercentage),
  })

  const usdToCurrencyRate = Number(
    currencyDataForOneUnit?.currencyConversionEstimation.usdCentAmount / 100,
  )

  const platformFeesInPercentage = convertPpmToPercentage({ ppm: platformFeesInPpm })

  const platformFeesAmount = amountCalculator.platformFeesAmount({
    voucherPrice: Number(voucherPrice),
    platformFeesInPpm: platformFeesInPpm,
  })

  const totalPaying = amountCalculator.voucherAmountAfterCommission({
    voucherPrice: Number(voucherPrice),
    commissionPercentage: Number(commissionPercentage),
  })

  const handleSubmit = async ({
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
            commissionPercentage,
            walletId,
            displayCurrency: currency,
            displayVoucherPrice: formatCurrency({
              amount: Number(amount),
              currency,
            }),
            salesAmountInCents: voucherPriceInCents,
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
    setSelectedWalletId(selected === "btc" ? btcWallet.id : usdWallet.id)
  }

  return (
    <ModalComponent open={open} onClose={onClose}>
      <div className={`${styles.modal_container} h-full`}>
        {modalLoading || withdrawLinkLoading ? (
          <LoadingComponent />
        ) : modalError ? (
          <ErrorMessage errorMessage={modalError} setModalError={setModalError} />
        ) : (
          <Details
            voucherAmountInDollars={voucherAmountInDollars}
            commissionPercentage={commissionPercentage}
            profitAmount={profitAmount}
            usdToCurrencyRate={usdToCurrencyRate}
            totalPaying={totalPaying}
            platformFeesInPercentage={platformFeesInPercentage}
            platformFeesAmount={platformFeesAmount}
            currency={currency}
            btcWallet={btcWallet}
            usdWallet={usdWallet}
            handleSelectChange={handleSelectChange}
            selectedWalletId={selectedWalletId}
            handleSubmit={handleSubmit}
            voucherPrice={voucherPrice}
            onClose={onClose}
          />
        )}
      </div>
    </ModalComponent>
  )
}

const ErrorMessage = ({
  errorMessage,
  setModalError,
}: {
  errorMessage: string
  setModalError: (value: string | null) => void
}) => (
  <div className="flex flex-col justify-between gap-4 h-full">
    <h1 className={styles.modalTitle}>Error</h1>
    <div className="text-center mt-0">
      <p className={styles.modalText}>{errorMessage}</p>
    </div>
    <Button className="w-full" onClick={() => setModalError(null)}>
      Okay
    </Button>
  </div>
)

const Details = ({
  voucherAmountInDollars,
  commissionPercentage,
  profitAmount,
  usdToCurrencyRate,
  totalPaying,
  platformFeesInPercentage,
  platformFeesAmount,
  currency,
  btcWallet,
  usdWallet,
  handleSelectChange,
  selectedWalletId,
  handleSubmit,
  voucherPrice,
  onClose,
}: {
  voucherAmountInDollars: number
  commissionPercentage: string
  profitAmount: number
  usdToCurrencyRate: number
  totalPaying: number
  platformFeesInPercentage: number
  platformFeesAmount: number
  currency: string
  btcWallet: WalletDetails
  usdWallet: WalletDetails
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  selectedWalletId: string
  voucherPrice: string
  onClose: (e: MouseEvent<HTMLButtonElement>) => void
  handleSubmit: ({
    voucherAmountInCents,
    commissionPercentage,
    walletId,
  }: {
    voucherAmountInCents: number
    commissionPercentage: number
    walletId: string
  }) => void
}) => {
  return (
    <>
      <div className="flex justify-between w-full">
        <div>
          <h3 className={styles.modalSubtitle}>Price</h3>
          <p className={styles.modalText}>
            {formatCurrency({ amount: Number(voucherPrice), currency })} {currency}
          </p>
        </div>
        <div>
          <h3 className={`${styles.modalSubtitle} text-right`}>Value</h3>
          <p className={styles.modalText}>
            {formatCurrency({ amount: Number(voucherAmountInDollars), currency })} USD
          </p>
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
      <div className="flex justify-between w-full">
        <div>
          <h3 className={styles.modalSubtitle}>Total Paying</h3>
          <p className={styles.modalText}>
            {formatCurrency({ amount: totalPaying, currency })} {currency}
          </p>
        </div>
        <div>
          <h3 className={`${styles.modalSubtitle} text-right`}>Platform fees</h3>
          <p className={`${styles.modalText} text-right`}>
            {platformFeesInPercentage}% (
            {formatCurrency({ amount: platformFeesAmount, currency })} {currency})
          </p>
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
}

export default ConfirmModal
