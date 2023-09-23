import QRCode from "qrcode"
import Image from "next/image"

import { isAdmin, serverUrl } from "@/services/config"

export default async function Card({ params }: { params: { id: string } }) {
  const { id } = params

  const cardApi = `${serverUrl}/api/card/id/${id}`
  const cardResult = await fetch(cardApi, { cache: "no-store" })
  const cardInfo = await cardResult.json()

  const transactionsApi = `${serverUrl}/api/card/id/${id}/transactions`
  const transactionsResult = await fetch(transactionsApi, { cache: "no-store" })
  const transactionInfo = await transactionsResult.json()

  let qrCode = ""

  if (isAdmin) {
    const wipeApi = `${serverUrl}/api/wipe?cardId=${id}`
    const wipeResult = await fetch(wipeApi, { cache: "no-store" })
    const wipeInfo = await wipeResult.json()

    // generate QR code
    qrCode = await QRCode.toDataURL(JSON.stringify(wipeInfo), { width: 400 })
  }

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
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="my-4">
        <h2>Wipe Card:</h2>
        <p>
          <strong>Warning:</strong> This will wipe the card and remove all funds. This
          action cannot be undone.
        </p>
        <p>
          <Image
            src={qrCode}
            alt={"qr code to activate"}
            width={400}
            height={400}
            unoptimized
          />
        </p>
      </section>
    </main>
  )
}
