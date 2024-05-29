import React, { useState, MouseEvent } from "react"

import { useRouter } from "next/navigation"

import { useSession } from "next-auth/react"

import Link from "next/link"

import styles from "./confirm-modal.module.css"

import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import { getWalletDetails, WalletDetails } from "@/utils/helpers"
import { useCreateWithdrawLinkMutation } from "@/lib/graphql/generated"
import LoadingComponent from "@/components/loading/loading-component"
import { convertPpmToPercentage, formatCurrency } from "@/lib/utils"
import { amountCalculator } from "@/lib/amount-calculator"
import { useCurrencyExchangeRate } from "@/hooks/use-currency-exchange-rate"

type Props = {
  open: boolean
  onClose: (currency: MouseEvent<HTMLButtonElement>) => void
  voucherPrice: number
  currency: string
  commissionPercentage: number
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
  platformFeesInPpm,
  voucherAmountInDollars,
  voucherPriceInCents,
}: Props) => {
  const router = useRouter()
  const { update, data: sessionData, status } = useSession()

  const [modalLoading, setModalLoading] = useState<boolean>(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [unauthorizedError, setUnauthorizedError] = useState<boolean>(false)

  const [createWithdrawLink, { loading: withdrawLinkLoading }] =
    useCreateWithdrawLinkMutation()

  if (status === "loading") {
    return (
      <ModalComponent open={true}>
        <div className={`${styles.modal_container} h-full`}>
          <LoadingComponent />
        </div>
      </ModalComponent>
    )
  }

  if (
    status === "unauthenticated" ||
    !sessionData?.userData?.me?.id ||
    unauthorizedError
  ) {
    return (
      <ModalComponent open={true}>
        <div className={`${styles.modal_container} h-full`}>
          <UnauthorizedModal />
        </div>
      </ModalComponent>
    )
  }

  const { btcWallet, usdWallet } = getWalletDetails({
    wallets: sessionData?.userData?.me?.defaultAccount?.wallets,
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
              amount: voucherPrice,
              currency,
            }),
            salesAmountInCents: voucherPriceInCents,
          },
        },
      })
      update()

      if (createWithdrawLinkResult.errors) {
        if (createWithdrawLinkResult.errors[0].message === "Unauthorized") {
          setUnauthorizedError(true)
          return
        }

        setModalError(createWithdrawLinkResult.errors[0].message)
        return
      }

      router.push(
        `/withdraw/${createWithdrawLinkResult.data?.createWithdrawLink.voucherSecret}/lnurl`,
      )
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "Unauthorized") {
          setUnauthorizedError(true)
          return
        }

        setModalError(err.message)
      }
      setModalLoading(false)
      console.log("error in creating invoice at create page", err)
    }
  }

  return (
    <ModalComponent open={open} onClose={onClose}>
      <div className={`${styles.modal_container} h-full`}>
        {modalLoading || withdrawLinkLoading ? (
          <LoadingComponent />
        ) : modalError ? (
          <ErrorMessage errorMessage={modalError} setModalError={setModalError} />
        ) : !btcWallet || !usdWallet ? (
          <ErrorMessage
            errorMessage={"Unable to find Wallets"}
            setModalError={setModalError}
          />
        ) : (
          <Details
            voucherAmountInDollars={voucherAmountInDollars}
            commissionPercentage={commissionPercentage}
            currency={currency}
            btcWallet={btcWallet}
            usdWallet={usdWallet}
            handleSubmit={handleSubmit}
            voucherPrice={voucherPrice}
            onClose={onClose}
            platformFeesInPpm={platformFeesInPpm}
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

const UnauthorizedModal = () => (
  <div className="flex flex-col justify-between gap-4 h-full">
    <h1 className={styles.modalTitle}>Error</h1>
    <div className="text-center mt-0">
      <p className={styles.modalText}>Session expired. Please log in again.</p>
    </div>
    <Link href="/">
      <Button className="w-full">Okay</Button>
    </Link>
  </div>
)

const Details = ({
  voucherAmountInDollars,
  commissionPercentage,
  platformFeesInPpm,
  currency,
  btcWallet,
  usdWallet,
  handleSubmit,
  voucherPrice,
  onClose,
}: {
  voucherAmountInDollars: number
  commissionPercentage: number
  platformFeesInPpm: number
  currency: string
  btcWallet: WalletDetails
  usdWallet: WalletDetails
  voucherPrice: number
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
  const [selectedWalletId, setSelectedWalletId] = useState(btcWallet.id)
  const platformFeesInPercentage = convertPpmToPercentage({ ppm: platformFeesInPpm })
  const exchangeRate = useCurrencyExchangeRate({
    currency,
    commissionPercentage,
  })

  const profitAmount = amountCalculator.profitAmount({
    voucherPrice,
    commissionPercentage: commissionPercentage,
  })
  const platformFeesAmount = amountCalculator.platformFeesAmount({
    voucherPrice,
    platformFeesInPpm,
  })
  const totalPaying = amountCalculator.voucherAmountAfterCommission({
    voucherPrice,
    commissionPercentage,
  })

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    setSelectedWalletId(selected === "btc" ? btcWallet.id : usdWallet.id)
  }

  return (
    <>
      <div className="flex justify-between w-full">
        <div>
          <h3 className={styles.modalSubtitle}>Price</h3>
          <p className={styles.modalText}>
            {formatCurrency({ amount: voucherPrice, currency })}
          </p>
        </div>
        <div>
          <h3 className={`${styles.modalSubtitle} text-right`}>Value</h3>
          <p className={styles.modalText}>
            {formatCurrency({ amount: voucherAmountInDollars, currency: "USD" })}
          </p>
        </div>
      </div>
      <div className="flex justify-between w-full">
        <div>
          <h3 className={styles.modalSubtitle}>Commission</h3>
          <p className={styles.modalText}>
            {commissionPercentage}%
            {currency !== "USD" &&
              ` (${formatCurrency({ amount: profitAmount, currency })})`}
          </p>
        </div>
        <div>
          {currency === "USD" ? (
            <>
              <h3 className={`${styles.modalSubtitle} text-right`}>Profit</h3>
              <p className={styles.modalText}>
                {formatCurrency({ amount: profitAmount, currency })}
              </p>
            </>
          ) : (
            <>
              <h3 className={`${styles.modalSubtitle} text-right`}>Rate</h3>
              <p className={styles.modalText}>
                {formatCurrency({ amount: 1, currency })} ={" "}
                {formatCurrency({
                  amount: exchangeRate,
                  currency: "USD",
                })}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-between w-full">
        <div>
          <h3 className={styles.modalSubtitle}>Total Paying</h3>
          <p className={styles.modalText}>
            {formatCurrency({ amount: totalPaying, currency })}
          </p>
        </div>
        <div>
          <h3 className={`${styles.modalSubtitle} text-right`}>Platform fees</h3>
          <p className={`${styles.modalText} text-right`}>
            {platformFeesInPercentage}% (
            {formatCurrency({ amount: platformFeesAmount, currency })})
          </p>
        </div>
      </div>
      <WalletOptions
        btcWallet={btcWallet}
        usdWallet={usdWallet}
        handleSelectChange={handleSelectChange}
      />
      <ButtonGroup
        voucherAmountInDollars={voucherAmountInDollars}
        commissionPercentage={commissionPercentage}
        selectedWalletId={selectedWalletId}
        handleSubmit={handleSubmit}
        onClose={onClose}
      />
    </>
  )
}

const ButtonGroup = ({
  voucherAmountInDollars,
  commissionPercentage,
  selectedWalletId,
  handleSubmit,
  onClose,
}: {
  voucherAmountInDollars: number
  commissionPercentage: number
  selectedWalletId: string
  handleSubmit: ({
    voucherAmountInCents,
    commissionPercentage,
    walletId,
  }: {
    voucherAmountInCents: number
    commissionPercentage: number
    walletId: string
  }) => void
  onClose: (e: MouseEvent<HTMLButtonElement>) => void
}) => {
  return (
    <div className="flex gap-2 mt-0 flex-col w-full">
      <Button
        className="w-full"
        data-testid="pay-voucher-amount-btn"
        onClick={() =>
          handleSubmit({
            voucherAmountInCents: Number((voucherAmountInDollars * 100).toFixed()),
            commissionPercentage: commissionPercentage,
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
  )
}

const WalletOptions = ({
  btcWallet,
  usdWallet,
  handleSelectChange,
}: {
  btcWallet: WalletDetails
  usdWallet: WalletDetails
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) => {
  return (
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
  )
}

export default ConfirmModal
