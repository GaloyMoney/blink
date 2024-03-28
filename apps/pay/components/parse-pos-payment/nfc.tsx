import React, { useState, useEffect } from "react"

import { getParams } from "js-lnurl"

import { Switch } from "../switch"

type Props = {
  paymentRequest?: string | undefined
}

// TODO: refine the interface
interface NFCRecord {
  data?: ArrayBuffer | DataView
  encoding?: string
}

function NFCComponent({ paymentRequest }: Props) {
  const [hasNFCPermission, setHasNFCPermission] = useState(false)
  const [nfcMessage, setNfcMessage] = useState("")
  const [isNfcSupported, setIsNfcSupported] = useState(false)
  const [isNfcTurnedOn, setIsNfcTurnedOn] = useState(false)

  useEffect(() => {
    const nfcTurnedOn = localStorage.getItem("isNfcTurnedOn") === "true"
    setIsNfcTurnedOn(nfcTurnedOn)
  }, [])

  const decodeNDEFRecord = (record: NFCRecord) => {
    if (!record.data) {
      console.log("No data found")
      return ""
    }

    let buffer: ArrayBuffer
    if (record.data instanceof ArrayBuffer) {
      buffer = record.data
    } else if (record.data instanceof DataView) {
      buffer = record.data.buffer
    } else {
      console.log("Data type not supported")
      return ""
    }

    const decoder = new TextDecoder(record.encoding || "utf-8")
    return decoder.decode(buffer)
  }

  const activateNfcScan = async () => {
    const response = await handleNFCScan()
    if (response instanceof Error) {
      alert(response.message)
      return
    } else {
      setIsNfcTurnedOn(true)
      localStorage.setItem("isNfcTurnedOn", "true")
      alert(
        "Boltcard is now active. There will be no need to activate it again. Please tap your card to redeem the payment",
      )
    }
  }

  const handleNFCScan = async () => {
    if (!("NDEFReader" in window)) {
      console.error("NFC is not supported")
      return new Error("NFC is not supported")
    }

    console.log("NFC is supported, start reading")
    const ndef = new NDEFReader()

    try {
      await ndef.scan()
      console.log("NFC scan started successfully.")

      ndef.onreading = (event) => {
        console.log("NFC tag read.")
        console.log(event.message)

        const record = event.message.records[0]
        const text = decodeNDEFRecord(record)

        setNfcMessage(text)
      }

      ndef.onreadingerror = () => {
        console.error("Cannot read data from the NFC tag. Try another one?")
        throw Error("Cannot read data from the NFC tag. Try another one?")
      }

      return
    } catch (error) {
      return new Error(`Error! Scan failed to start: ${error}.`)
    }
  }

  useEffect(() => {
    setIsNfcSupported("NDEFReader" in window)
    ;(async () => {
      if (!("permissions" in navigator)) {
        console.error("Permissions API not supported")
        return
      }

      let result: PermissionStatus
      try {
        /* eslint @typescript-eslint/ban-ts-comment: "off" */
        // @ts-ignore-next-line
        result = await navigator.permissions.query({ name: "nfc" })
      } catch (err) {
        console.error("Error querying NFC permission", err)
        return
      }

      console.log("result permission query", result)

      if (result.state === "granted") {
        setHasNFCPermission(true)
      } else {
        setHasNFCPermission(false)
      }

      result.onchange = () => {
        if (result.state === "granted") {
          setHasNFCPermission(true)
        } else {
          setHasNFCPermission(false)
        }
      }
    })()
  }, [setHasNFCPermission])

  React.useEffect(() => {
    console.log("hasNFCPermission", hasNFCPermission)

    if (hasNFCPermission && isNfcTurnedOn) {
      handleNFCScan()
    }

    // handleNFCScan leads to an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNFCPermission])

  React.useEffect(() => {
    ;(async () => {
      if (!nfcMessage) {
        return
      }

      if (!nfcMessage.toLowerCase().includes("lnurl")) {
        alert("Not a compatible boltcard")
        return
      }

      if (!paymentRequest) {
        alert("add an amount and create an invoice before scanning the card")
        return
      }

      const sound = new Audio("/payment-sound.mp3")
      sound
        .play()
        .then(() => {
          console.log("Playback started successfully")
        })
        .catch((error) => {
          console.error("Playback failed", error)
        })

      const lnurlParams = await getParams(nfcMessage)

      if (!("tag" in lnurlParams && lnurlParams.tag === "withdrawRequest")) {
        alert(
          `not a properly configured lnurl withdraw tag\n\n${nfcMessage}\n\n${
            "reason" in lnurlParams && lnurlParams.reason
          }`,
        )
        return
      }

      const { callback, k1 } = lnurlParams

      const urlObject = new URL(callback)
      const searchParams = urlObject.searchParams
      searchParams.set("k1", k1)
      searchParams.set("pr", paymentRequest)

      const url = urlObject.toString()

      const result = await fetch(url)
      if (result.ok) {
        const lnurlResponse = await result.json()
        if (lnurlResponse?.status?.toLowerCase() !== "ok") {
          console.error(lnurlResponse, "error with redeeming")
        }

        console.log("payment successful")
      } else {
        let errorMessage = ""
        try {
          const decoded = await result.json()
          if (decoded.reason) {
            errorMessage += decoded.reason
          }
          if (decoded.message) {
            errorMessage += decoded.message
          }
        } finally {
          let message = `Error processing payment.\n\nHTTP error code: ${result.status}`
          if (errorMessage) {
            message += `\n\nError message: ${errorMessage}`
          }
          alert(message)
        }
      }
    })()
  }, [nfcMessage, paymentRequest])

  const handleSwitchChange = async () => {
    if (!isNfcTurnedOn) {
      activateNfcScan()
    } else {
      localStorage.setItem("isNfcTurnedOn", "false")
      setIsNfcTurnedOn(false)
    }
  }

  return (
    <>
      {isNfcSupported && !paymentRequest && (
        <div className="flex flex-row justify-between align-middle align-content-center m-0 rounded-md">
          <p className="mb-4 font-semibold">Boltcard</p>
          <Switch
            checked={hasNFCPermission && isNfcTurnedOn}
            onCheckedChange={handleSwitchChange}
          />
        </div>
      )}
    </>
  )
}

export default NFCComponent
