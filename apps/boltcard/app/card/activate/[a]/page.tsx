import QRCode from "qrcode"
import Image from "next/image"

import { serverUrl } from "@/services/config"

export default async function ActivateCard({ params }: { params: { a: string } }) {
  const { a } = params

  const url = `${serverUrl}/api/activate?a=${a}`
  const res = await fetch(url, { cache: "no-store" })
  const activationParams = await res.json()
  const warning = activationParams.warning

  const qrCode = await QRCode.toDataURL(url, { width: 400 })

  return (
    <>
      <div>
        <h1>Activate Card</h1>
        <p>
          card page:{" "}
          <a href={`/card/${activationParams.card_name}`}>{activationParams.card_name}</a>
        </p>
        {warning && (
          <p>{"card should not be programmed twice with the same sets of keys"}</p>
        )}
        <Image
          src={qrCode}
          alt={"qr code to activate"}
          width={400}
          height={400}
          unoptimized
        />
      </div>
    </>
  )
}
