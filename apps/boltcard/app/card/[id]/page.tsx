import QRCode from "qrcode"
import Image from "next/image"

import { isAdmin, serverUrl } from "@/services/config"

export default async function Card({ params }: { params: { id: string } }) {
  const { id } = params

  const cardApi = `${serverUrl}/api/card/${id}`
  const cardResult = await fetch(cardApi, { cache: "no-store" })
  const cardInfo = await cardResult.json()

  const transactionsApi = `${serverUrl}/api/card/${id}/transactions`
  const transactionsResult = await fetch(transactionsApi, { cache: "no-store" })
  const transactionsInfo = await transactionsResult.json()

  let onchainQRCode = ""

  if (cardInfo?.onchainAddress) {
    onchainQRCode = await QRCode.toDataURL(cardInfo.onchainAddress, { width: 300 })
  }

  let lnurlQrCode = ""

  if (cardInfo?.lnurlp) {
    lnurlQrCode = await QRCode.toDataURL(cardInfo.lnurlp, { width: 300 })
  }

  const invoiceApi = `${serverUrl}/api/card/${id}/invoice`
  const invoiceResult = await fetch(invoiceApi, { cache: "no-store" })
  const invoiceInfo = await invoiceResult.json()
  const invoice = invoiceInfo?.data
  let invoiceQrCode = ""

  if (invoice) {
    invoiceQrCode = await QRCode.toDataURL(invoice, { width: 300 })
  }

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
            <strong>ID:</strong> {cardInfo?.id}
          </li>
          <li>
            <strong>UID:</strong> {cardInfo?.uid}
          </li>
          <li>
            <strong>Lightning address</strong> {cardInfo?.lightningAddress}
          </li>
          <li>
            <strong>Enabled:</strong> {cardInfo?.enabled ? "Yes" : "No"}
          </li>
          <li>
            <strong>Onchain Address:</strong> {cardInfo?.onchainAddress}
            {onchainQRCode && (
              <div className="mt-2">
                <Image
                  src={onchainQRCode}
                  alt={"QR code for onchain address"}
                  width={300} // Adjust the size as needed
                  height={300} // Adjust the size as needed
                  unoptimized
                />
              </div>
            )}
          </li>
          <li>
            <strong>lnurlp:</strong> {cardInfo?.lnurlp}
            {lnurlQrCode && (
              <div className="mt-2">
                <Image
                  src={lnurlQrCode}
                  alt={"QR code for lnurp payment"}
                  width={300} // Adjust the size as needed
                  height={300} // Adjust the size as needed
                  unoptimized
                />
              </div>
            )}
          </li>
          <li>
            <strong>invoice:</strong> {invoice}
            {invoiceQrCode && (
              <div className="mt-2">
                <Image
                  src={invoiceQrCode}
                  alt={"QR code for invoice"}
                  width={300} // Adjust the size as needed
                  height={300} // Adjust the size as needed
                  unoptimized
                />
              </div>
            )}
          </li>
        </ul>
      </section>

      <section className="my-4">
        <h2>Transactions:</h2>
        <ul>
          {transactionsInfo.map((tx, index) => (
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
          <strong>Warning:</strong> This will wipe the card and reset it to factory
          settings. Any remaining funds will be unaccessible.
        </p>
        <p>
          <Image
            src={qrCode}
            alt={"qr code to program"}
            width={300}
            height={300}
            unoptimized
          />
        </p>
      </section>
    </main>
  )
}
