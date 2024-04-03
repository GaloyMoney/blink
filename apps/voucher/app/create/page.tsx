"use client";
import { useState } from "react";
import CreatePageAmount from "@/components/Create/CreatePageAmount/CreatePageAmount";
import CreatePagePercentage from "@/components/Create/CreatePagePercentage/CreatePagePercentage";
import {
  Currency,
  useCreateWithdrawLinkMutation,
  useLnUsdInvoiceCreateOnBehalfOfRecipientMutation,
} from "@/utils/generated/graphql";
import useSatsPrice from "@/hooks/useSatsPrice";
import PageLoadingComponent from "@/components/Loading/PageLoadingComponent";
import {
  calculateCommission,
  errorArrayToString,
  generateRandomHash,
} from "@/utils/helpers";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/Create/ConifrmModal/ConfirmModal";
import InfoComponent from "@/components/InfoComponent/InfoComponent";
import useRealtimePrice from "@/hooks/useRealTimePrice";
import { DEFAULT_CURRENCY } from "@/config/appConfig";
import { env } from "@/env";
const { NEXT_PUBLIC_ESCROW_WALLET_USD } = env;

export default function CreatePage() {
  const { usdToSats } = useSatsPrice();
  const storedCurrency =
    typeof window !== "undefined" ? localStorage.getItem("currency") : null;
  const storedCommission =
    typeof window !== "undefined" ? localStorage.getItem("commission") : null;

  const [currency, setCurrency] = useState<Currency>(
    storedCurrency ? JSON.parse(storedCurrency) : DEFAULT_CURRENCY
  );

  const [commissionPercentage, setCommissionPercentage] = useState<string>(
    storedCommission || "0"
  );
  const { currencyToCents, hasLoaded } = useRealtimePrice(currency.id);
  const [currentPage, setCurrentPage] = useState<string>("AMOUNT");
  const [amount, setAmount] = useState<string>("0");
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const [loadingPageChange, setLoadingPageChange] = useState<boolean>(false);

  const router = useRouter();
  const AmountInDollars = (
    currencyToCents(Number(amount), currency.id, currency.fractionDigits)
      .convertedCurrencyAmount / 100
  ).toFixed(2);

  const commissionAmountInDollars = calculateCommission(
    AmountInDollars,
    commissionPercentage
  );

  const [
    createWithdrawLink,
    { loading: withdrawLinkLoading, error: withdrawLinkError },
  ] = useCreateWithdrawLinkMutation();

  const [
    createLnUsdInvoice,
    { loading: lnUSDInvoiceLoading, error: lnUSDInvoiceError },
  ] = useLnUsdInvoiceCreateOnBehalfOfRecipientMutation();

  const handleSubmit = async () => {
    setLoadingPageChange(true);
    try {
      const result = await createLnUsdInvoice({
        variables: {
          input: {
            recipientWalletId: `${NEXT_PUBLIC_ESCROW_WALLET_USD}`,
            amount: Math.round(Number(commissionAmountInDollars) * 100),
            memo: `Galoy withdraw  $${Number(
              commissionAmountInDollars
            )} @${Number(commissionPercentage)}`,
          },
        },
        context: {
          endpoint: "MAINNET",
        },
      });

      const data = result.data?.lnUsdInvoiceCreateOnBehalfOfRecipient.invoice;
      const error = errorArrayToString(
        result.data?.lnUsdInvoiceCreateOnBehalfOfRecipient.errors?.map(
          (error) => new Error(error.message)
        )
      );
      if (!error && data) {
        const createWithdrawLinkResult = await createWithdrawLink({
          variables: {
            input: {
              payment_hash: data.paymentHash,
              user_id: "aaaaaaaa-e098-4a16-932b-e4f4abc24366",
              payment_request: data.paymentRequest,
              payment_secret: data.paymentSecret,
              sales_amount: Number(AmountInDollars),
              account_type: "USD",
              escrow_wallet: `${NEXT_PUBLIC_ESCROW_WALLET_USD}`,
              title: `Galoy withdraw  $${Number(
                commissionAmountInDollars
              )} @${Number(commissionPercentage)}`,
              voucher_amount: Number(
                (Number(commissionAmountInDollars) * 100).toFixed()
              ),
              unique_hash: generateRandomHash(),
              k1: generateRandomHash(),
              commission_percentage: Number(commissionPercentage),
            },
          },
        });
        router.push(
          `/fund/${createWithdrawLinkResult.data?.createWithdrawLink.id}`
        );
      }
    } catch (err) {
      setLoadingPageChange(false);
      console.log("error in creating invoice at create page", err);
    }
  };

  if (withdrawLinkLoading || lnUSDInvoiceLoading || loadingPageChange) {
    return <PageLoadingComponent />;
  }

  if (currentPage === "AMOUNT") {
    return (
      <div className="top_page_container">
        <ConfirmModal
          open={confirmModal}
          onClose={() => setConfirmModal(false)}
          handleSubmit={handleSubmit}
          amount={amount}
          currency={currency}
          commissionPercentage={commissionPercentage}
          commissionAmountInDollars={commissionAmountInDollars}
          usdToSats={usdToSats}
        />

        <CreatePageAmount
          amount={amount}
          currency={currency}
          setAmount={setAmount}
          setCurrency={setCurrency}
          setCurrentPage={setCurrentPage}
          usdToSats={usdToSats}
          setConfirmModal={setConfirmModal}
          commissionPercentage={commissionPercentage}
          AmountInDollars={AmountInDollars}
          commissionAmountInDollars={commissionAmountInDollars}
          hasLoaded={hasLoaded}
        />
      </div>
    );
  } else {
    return (
      <>
        <div className="top_page_container">
          <CreatePagePercentage
            commissionPercentage={commissionPercentage}
            setCommissionPercentage={setCommissionPercentage}
            setCurrentPage={setCurrentPage}
          />
          <InfoComponent>
            Please enter the commission percentage that will be deducted from
            the original Link amount. The maximum commission is 99 percent.
          </InfoComponent>
        </div>
      </>
    );
  }
}
