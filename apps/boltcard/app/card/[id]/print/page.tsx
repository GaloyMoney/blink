import fs from "fs"

import { BLANK_PDF, Template, generate } from "@pdfme/generator"

import { serverUrl } from "@/services/config"

const template: Template = {
  basePdf: BLANK_PDF,
  schemas: [
    {
      brand: {
        type: "text",
        position: { x: 10, y: 10 },
        width: 10,
        height: 10,
      },
      onchainAddress: {
        type: "qrcode",
        position: {
          x: 10,
          y: 30,
        },
        width: 26.53,
        height: 26.53,
      },
      deposit: {
        type: "text",
        position: {
          x: 10,
          y: 24,
        },
        width: 26.53,
        height: 26.53,
      },
      cardUrl: {
        type: "qrcode",
        position: {
          x: 60,
          y: 30,
        },
        width: 26.53,
        height: 26.53,
      },
      cardInfo: {
        type: "text",
        position: {
          x: 60,
          y: 24,
        },
        width: 26.53,
        height: 26.53,
      },
      nfc: {
        type: "image",
        position: {
          x: 80,
          y: 10,
        },
        width: 10,
        height: 6,
      },
    },
  ],
}

export default async function CardPDF({ params }: { params: { id: string } }) {
  const { id } = params
  const cardApi = `${serverUrl}/api/card/${id}`
  const cardResult = await fetch(cardApi, { cache: "no-store" })
  const cardJson = await cardResult.json()

  const onchainAddress = cardJson?.onchainAddress

  if (!onchainAddress) {
    return <p>no onchain address</p>
  }

  const brand = "blink"
  const deposit = "deposit"
  const cardInfo = "cardInfo"

  function bufferToDataURL(buffer: Buffer, mimeType: string) {
    return `data:${mimeType};base64,${buffer.toString("base64")}`
  }

  const nfcRaw = fs.readFileSync("./public/nfc-logo.png")
  const nfc =
    "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16h8RPE39g6M9tayhdT1MNb2+CN8MJGJZ8deB8qn1Of4a+e6ACtbw7o0+v6zpulxbgLiYefIv/LK3T55ZORjIAOM98DvWTXtvwn8PNZ2F1r1zEVuNS/cWW8AMLJCCXHf52H5ID0bkA9Jhhht4YIIUCQwRpDEg6JGihVUZ9BT6KKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAOC8Q/DHQdauZb20nk026mZnn8mJZbeV253mHK4PrhhnrjJyZvDPw40Lw/Ot7PK+o3yLiN7iNEghJGC0UPzfN7lj7Yrt6KACqWqapp+jWN1qN/KsVvboWYkjc7Y+WOME8s3QCrteVfGO7u0tfDtkhItbia8uJ8A4aWBY1jBbpxvY4/wAKAPMNf1y+8Q6pdaneHDykJDEDlIIFzsiQ8cDucckk96yqKfFFLPLDDCjSTTSJFEiDLO7kKqqB3J4FAG74Q8PS+JdatbHDC0jIuNQkGfktkI3KCP4m4VfrntX0vFFFDHFDEipFEiRRIgwqIg2qqgdgK5jwT4Wh8MaVHHIqNqd2Fm1GZcH5+qwq391OnXk5PfA6mgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuf8WeGLXxTpn2KWVoJ4ZftFnOoDbJgjJhwRkoc8gEdB6c9BRQB823fgPxxaXD250e5n2uEWa0HnQPnGGV17fUD8MV6L4B+H1xpE6a1rix/blV1s7MFZBak4HnSOpK78ZAAyADnOTiP02igAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//2Q=="

  const cardUrl = `${serverUrl}/card/${id}`

  const inputs = [{ brand, onchainAddress, deposit, cardUrl, cardInfo, nfc }]

  const pdf = await generate({ template, inputs })
  console.log(pdf)

  // Node.js
  const res = fs.writeFileSync(`test.pdf`, pdf)
  console.log(res)
}
