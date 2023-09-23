import QRCode from "qrcode"
import Image from "next/image"

import { serverUrl } from "@/services/config"

export default async function ProgramCard({ params }: { params: { id: string } }) {
  const { id } = params

  const url = `${serverUrl}/api/program?cardId=${id}`
  const res = await fetch(url, { cache: "no-store" })
  const activationParams = await res.json()

  if (activationParams.status === "ERROR") {
    return (
      <>
        <div>invalid activation params</div>
        <div>{activationParams?.reason}</div>
      </>
    )
  }

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
          alt={"qr code to program"}
          width={400}
          height={400}
          unoptimized
        />
      </div>
    </>
  )
}
