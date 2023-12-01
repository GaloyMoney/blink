import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"
import ReactToPrint from "react-to-print"
import { bech32 } from "bech32"
import { QRCode } from "react-qrcode-logo"
import { useRef } from "react"

import { NextRequest } from "next/server"
import originalUrl from "original-url"

import { env } from "../../env"

export async function getServerSideProps({
  req,
  params: { username },
}: {
  req: NextRequest
  params: { username: string }
}) {
  // eslint-disable-next-line
  // @ts-ignore
  const url = originalUrl(req)

  const lnurl = bech32.encode(
    "lnurl",
    bech32.toWords(
      Buffer.from(
        `${url.protocol}//${url.hostname}/.well-known/lnurlp/${username}`,
        "utf8",
      ),
    ),
    1500,
  )

  // Note: add the port to the webURL for local development
  const webURL = `${url.protocol}//${url.hostname}/${username}`

  const qrCodeURL = (webURL + "?lightning=" + lnurl).toUpperCase()

  return {
    props: {
      qrCodeURL,
      username,
      userHeader: `Pay ${username}@${env.NEXT_PUBLIC_PAY_DOMAIN}`,
    },
  }
}

export default function Print({
  qrCodeURL,
  username,
  userHeader,
}: {
  lightningAddress: string
  qrCodeURL: string
  username: string
  userHeader: string
}) {
  const componentRef = useRef<HTMLDivElement | null>(null)

  return (
    <>
      {/* FIXME: Avoid duplicate code and use one component for both print and web display */}
      <div style={{ display: "none" }}>
        <Container fluid ref={componentRef}>
          <br />
          <Row className="justify-content-md-center">
            <Col md="auto">
              <Card className="text-center">
                <Card.Body>
                  <Card.Text>
                    <span className="user-header">{userHeader}</span>
                    <p>
                      {`Display this static QR code online or in person to allow anybody to
                    pay ${username.toLowerCase()}.`}
                    </p>
                    <QRCode
                      ecLevel="H"
                      value={qrCodeURL}
                      size={800}
                      logoImage="/blink-qr-logo.png"
                      logoWidth={250}
                    />
                    <Card.Text>
                      <strong>
                        Having trouble scanning this QR code with your wallet?
                      </strong>{" "}
                      Some wallets do not support printed QR codes like this one. Scan
                      with the camera app on your phone to be taken to a webpage where you
                      can create a fresh invoice for paying from any Lightning wallet.
                    </Card.Text>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <br />
        </Container>
      </div>
      <Container fluid>
        <br />
        <Row className="justify-content-md-center">
          <Col md="auto">
            <Card className="text-center">
              <Card.Body>
                <Card.Text>
                  <span className="user-header">{userHeader}</span>
                  <p>
                    {`Display this static QR code online or in person to allow anybody to
                    pay ${username.toLowerCase()}.`}
                  </p>
                  <QRCode
                    ecLevel="H"
                    value={qrCodeURL}
                    size={300}
                    logoImage="/blink-qr-logo.png"
                    logoWidth={100}
                  />
                </Card.Text>
                <Card.Text
                  style={{ fontSize: "13px", maxWidth: "500px", margin: "0 auto" }}
                >
                  <strong>Having trouble scanning this QR code with your wallet?</strong>{" "}
                  Some wallets do not support printed QR codes like this one. Scan with
                  the camera app on your phone to be taken to a webpage where you can
                  create a fresh invoice for paying from any Lightning wallet.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <br />
      </Container>
      <Row className="justify-content-center">
        <ReactToPrint
          trigger={() => <button className="print-paycode-button">Print QR Code</button>}
          content={() => componentRef.current}
          onBeforeGetContent={() => {
            const qrcodeLogo = document.getElementById("react-qrcode-logo")
            if (qrcodeLogo) {
              qrcodeLogo.style.height = "1000px"
              qrcodeLogo.style.width = "1000px"
            }
          }}
        />
      </Row>
    </>
  )
}
