"use client"
import Col from "react-bootstrap/Col"
import Row from "react-bootstrap/Row"
import Card from "react-bootstrap/Card"
import Container from "react-bootstrap/Container"
import ReactToPrint from "react-to-print"
import { bech32 } from "bech32"
import { QRCode } from "react-qrcode-logo"
import { useRef } from "react"

export default function Print({
  params,
}: {
  params: {
    username: string
  }
}) {
  const { username } = params
  const componentRef = useRef<HTMLDivElement | null>(null)
  const url = new URL(window.location.href)
  const unencodedLnurl = `${url.protocol}//${url.host}/.well-known/lnurlp/${username}`
  const lnurl = bech32.encode(
    "lnurl",
    bech32.toWords(Buffer.from(unencodedLnurl, "utf8")),
    1500,
  )
  const webURL = `${url.protocol}//${url.host}/${username}`
  const qrCodeURL = (webURL + "?lightning=" + lnurl).toUpperCase()
  const userHeader = `Pay ${username}@${url.hostname}`

  return (
    <>
      {/* FIXME: Avoid duplicate code and use one component for both print and web display */}
      <div style={{ display: "none" }}>
        <Container fluid ref={componentRef}>
          <br />
          <Row className="justify-content-md-center">
            <Col md="auto">
              <Card data-testid="qrcode-container" className="text-center">
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
        <Row className="justify-content-md-center">
          <Col md="auto">
            <div className="text-center">
              <div>
                <Card.Text
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
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
              </div>
            </div>
          </Col>
        </Row>
        <br />
      </Container>
      <Row className="justify-content-center ">
        <ReactToPrint
          trigger={() => (
            <button data-testid="print-btn" className="print-paycode-button">
              Print QR Code
            </button>
          )}
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
