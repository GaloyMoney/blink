import { formatDate, formatNumber } from "../../app/utils"

type Props = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  transactions
}

/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any error
const hashOrCounterParty = (txn: TransactionListType[number]) => {
  if (
    txn.settlementVia.__typename === "SettlementViaOnChain" &&
    txn.settlementVia.transactionHash
  ) {
    return (
      <a
        target="_blank"
        rel="noreferrer"
        className="underline"
        href={`https://mempool.space/tx/${txn.settlementVia.transactionHash}`}
      >
        {txn.settlementVia.transactionHash}
      </a>
    )
  }

  if (txn.initiationVia.__typename === "InitiationViaLn") {
    return txn.initiationVia.paymentHash
  }

  if (txn.settlementVia.__typename === "SettlementViaIntraLedger") {
    return (
      txn.settlementVia.counterPartyUsername ||
      txn.settlementVia.counterPartyWalletId ||
      "--"
    )
  }

  return "--"
}

const Transactions: React.FC<Props> = ({ transactions }) => {
  const mapViaType = (value: string) => {
    switch (value) {
      case "InitiationViaIntraLedger":
      case "SettlementViaIntraLedger":
        return "Intra ledger"
      case "InitiationViaLn":
      case "SettlementViaLn":
        return "Lightning"
      case "InitiationViaOnChain":
      case "SettlementViaOnChain":
        return "OnChain"
      default:
        return value
    }
  }
  const hasData = transactions && transactions.length > 0
  const isInternalTx =
    hasData &&
    transactions.every(
      /* eslint @typescript-eslint/ban-ts-comment: "off" */
      // @ts-ignore-next-line no-implicit-any error
      (txn) => txn?.initiationVia.__typename === "InitiationViaIntraLedger",
    )
  return (
    <div className="shadow w-full overflow-hidden rounded-lg shadow-xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full whitespace-no-wrap">
          <thead>
            <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800">
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">Initiation</th>
              <th className="px-4 py-3">Settlement</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Memo</th>
              <th className="px-4 py-3">{isInternalTx ? "Counter Party" : "Hash"}</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
            {hasData &&
              // @ts-ignore-next-line no-implicit-any error
              transactions.map((txn) => (
                <tr key={txn?.id} className="text-gray-700 dark:text-gray-400">
                  <td className="px-4 py-3">{txn?.id}</td>
                  <td className="px-4 py-3">
                    {mapViaType(txn?.initiationVia?.__typename ?? "")}
                  </td>
                  <td className="px-4 py-3">
                    {mapViaType(txn?.settlementVia?.__typename ?? "")}
                  </td>
                  <td className="px-4 py-3">{formatNumber(txn?.settlementAmount)}</td>
                  <td className="px-4 py-3">{formatNumber(txn?.settlementFee)}</td>
                  <td className="px-4 py-3">
                    {formatNumber(txn?.settlementPrice?.formattedAmount ?? "")}
                  </td>
                  <td className="px-4 py-3">{txn?.direction}</td>
                  <td className="px-4 py-3">{txn?.status}</td>
                  <td className="px-4 py-3 break-all">{txn?.memo}</td>
                  <td className="px-4 py-3 break-all">{hashOrCounterParty(txn)}</td>
                  <td className="px-4 py-3">{formatDate(txn?.createdAt)}</td>
                </tr>
              ))}
            {!hasData && (
              <tr className="text-gray-700 dark:text-gray-400">
                <td colSpan={11} className="px-4 py-3 text-center">
                  {"No data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Transactions
