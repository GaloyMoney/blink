import { serverApi } from "@/services/config"

export default async function Card({ params }: { params: { id: string } }) {
  const { id } = params

  const cardApi = `${serverApi}/card/id/${id}`
  const cardResult = await fetch(cardApi, { cache: "no-store" })
  const cardInfo = await cardResult.json()

  const transactionsApi = `${serverApi}/card/id/${id}/transactions`
  const transactionsResult = await fetch(transactionsApi)
  const transactionInfo = await transactionsResult.json()

  return (
    <main className="flex flex-col min-h-screen items-center justify-center">
      <h1>boltcard</h1>

      <section className="my-4">
        <h2>Card Information:</h2>
        <ul>
          <li>
            <strong>ID:</strong> {cardInfo.id}
          </li>
          <li>
            <strong>UID:</strong> {cardInfo.uid}
          </li>
          <li>
            <strong>Onchain Address:</strong> {cardInfo.onchainAddress}
          </li>
          <li>
            <strong>Lightning address</strong> {cardInfo.lightningAddress}
          </li>
          <li>
            <strong>Enabled:</strong> {cardInfo.enabled ? "Yes" : "No"}
          </li>
        </ul>
      </section>

      <section className="my-4">
        <h2>Transactions:</h2>
        <ul>
          {transactionInfo.map((tx, index) => (
            <li key={tx.id} className="mb-2">
              <strong>Transaction {index + 1}:</strong>
              <ul>
                <li>
                  <strong>ID:</strong> {tx.id}
                </li>
                <li>
                  <strong>Status:</strong> {tx.status}
                </li>
                <li>
                  <strong>Direction:</strong> {tx.direction}
                </li>
                <li>
                  <strong>Memo:</strong> {tx.memo}
                </li>
                <li>
                  <strong>Amount:</strong> {tx.settlementDisplayAmount}{" "}
                  {tx.settlementDisplayCurrency}
                </li>
                <li>
                  <strong>Fee:</strong> {tx.settlementDisplayFee}{" "}
                  {tx.settlementDisplayCurrency}
                </li>
                {/* Add more fields as required */}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
