import util from "util"

import { Struct, Value, ListValue } from "google-protobuf/google/protobuf/struct_pb"

import { credentials, Metadata, status } from "@grpc/grpc-js"

import { getBriaConfig } from "@config"

import {
  OnChainAddressAlreadyCreatedForRequestIdError,
  OnChainAddressNotFoundError,
  UnknownOnChainServiceError,
} from "@domain/bitcoin/onchain"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared/primitives"

import {
  asyncRunInSpan,
  SemanticAttributes,
  recordExceptionInCurrentSpan,
  wrapAsyncFunctionsToRunInSpan,
} from "@services/tracing"

import { BriaEventRepo } from "./repo"
import { ListenerWrapper } from "./listener_wrapper"
import { BriaServiceClient } from "./proto/bria_grpc_pb"
import {
  SubscribeAllRequest,
  BriaEvent as RawBriaEvent,
  NewAddressRequest,
  NewAddressResponse,
  GetWalletBalanceSummaryRequest,
  GetWalletBalanceSummaryResponse,
  FindAddressByExternalIdRequest,
  FindAddressByExternalIdResponse,
} from "./proto/bria_pb"
import {
  EventAugmentationMissingError,
  ExpectedAddressInfoMissingInEventError,
  ExpectedPayoutBroadcastPayloadNotFoundError,
  ExpectedPayoutCommittedPayloadNotFoundError,
  ExpectedPayoutSettledPayloadNotFoundError,
  ExpectedPayoutSubmittedPayloadNotFoundError,
  ExpectedUtxoDetectedPayloadNotFoundError,
  ExpectedUtxoSettledPayloadNotFoundError,
  NoPayloadFoundError,
  UnknownBriaEventError,
  UnknownPayloadTypeReceivedError,
} from "./errors"

export { ListenerWrapper } from "./listener_wrapper"

const briaConfig = getBriaConfig()

const bitcoinBridgeClient = new BriaServiceClient(
  briaConfig.endpoint,
  credentials.createInsecure(),
)

const newAddress = util.promisify<NewAddressRequest, Metadata, NewAddressResponse>(
  bitcoinBridgeClient.newAddress.bind(bitcoinBridgeClient),
)
const findAddressByExternalId = util.promisify<
  FindAddressByExternalIdRequest,
  Metadata,
  FindAddressByExternalIdResponse
>(bitcoinBridgeClient.findAddressByExternalId.bind(bitcoinBridgeClient))
const getWalletBalanceSummary = util.promisify<
  GetWalletBalanceSummaryRequest,
  Metadata,
  GetWalletBalanceSummaryResponse
>(bitcoinBridgeClient.getWalletBalanceSummary.bind(bitcoinBridgeClient))

export const BriaPayloadType = {
  UtxoDetected: "utxo_detected",
  UtxoSettled: "utxo_settled",
  PayoutSubmitted: "payout_submitted",
  PayoutCommitted: "payout_committed",
  PayoutBroadcast: "payout_broadcast",
  PayoutSettled: "payout_settled",
} as const

const eventRepo = BriaEventRepo()

export const BriaSubscriber = () => {
  const metadata = new Metadata()
  metadata.set("x-bria-api-key", briaConfig.apiKey)

  const subscribeToAll = async (
    eventHandler: BriaEventHandler,
  ): Promise<ListenerWrapper | BriaEventError> => {
    const subscribeAll = bitcoinBridgeClient.subscribeAll.bind(bitcoinBridgeClient)

    let listenerWrapper: ListenerWrapper
    try {
      const lastSequence = await eventRepo.getLatestSequence()
      if (lastSequence instanceof Error) {
        return lastSequence
      }

      const request = new SubscribeAllRequest()
      request.setAugment(true)
      request.setAfterSequence(lastSequence)

      listenerWrapper = new ListenerWrapper(
        subscribeAll(request, metadata),
        (error: Error) => {
          if (!error.message.includes("CANCELLED")) {
            listenerWrapper._listener.cancel()
            throw error
          }
        },
      )
    } catch (error) {
      return new UnknownBriaEventError(error.message || error)
    }

    listenerWrapper._setDataHandler((rawEvent: RawBriaEvent) => {
      asyncRunInSpan(
        "service.bria.eventReceived",
        {
          attributes: {
            [SemanticAttributes.CODE_FUNCTION]: "eventReceived",
            [SemanticAttributes.CODE_NAMESPACE]: "services.bria",
            rawEvent: JSON.stringify(rawEvent.toObject()),
          },
        },
        async () => {
          const event = translate(rawEvent)
          if (event instanceof Error) {
            recordExceptionInCurrentSpan({ error: event })
            throw event
          }
          const result = await eventHandler(event)

          if (result instanceof Error) {
            recordExceptionInCurrentSpan({ error: result })
            const resubscribe = await subscribeToAll(eventHandler)
            if (resubscribe instanceof Error) {
              throw resubscribe
            }
            listenerWrapper._merge(resubscribe)
          }

          const res = await eventRepo.persistEvent(event)
          if (res instanceof Error) {
            recordExceptionInCurrentSpan({ error: res })
            throw res
          }
        },
      )
    })

    return listenerWrapper
  }

  return {
    subscribeToAll,
  }
}

export const NewOnChainService = (): INewOnChainService => {
  const metadata = new Metadata()
  metadata.set("x-bria-api-key", briaConfig.apiKey)

  const getBalance = async (): Promise<BtcPaymentAmount | OnChainServiceError> => {
    try {
      const request = new GetWalletBalanceSummaryRequest()
      request.setWalletName(briaConfig.walletName)

      const response = await getWalletBalanceSummary(request, metadata)

      return paymentAmountFromNumber({
        amount: response.getEffectiveSettled(),
        currency: WalletCurrency.Btc,
      })
    } catch (error) {
      return new UnknownOnChainServiceError(error.message || error)
    }
  }

  const createOnChainAddress = async ({
    walletId,
    requestId,
  }: {
    walletId: WalletId
    requestId?: OnChainAddressRequestId
  }): Promise<OnChainAddressIdentifier | OnChainServiceError> => {
    try {
      const request = new NewAddressRequest()
      request.setWalletName(briaConfig.walletName)
      request.setMetadata(constructMetadata({ galoy: { walletId } }))
      if (requestId) {
        request.setExternalId(requestId)
      }

      const response = await newAddress(request, metadata)
      return { address: response.getAddress() as OnChainAddress }
    } catch (err) {
      if (err.code == status.ALREADY_EXISTS) {
        return new OnChainAddressAlreadyCreatedForRequestIdError()
      }
      const errMsg = typeof err === "string" ? err : err.message
      return new UnknownOnChainServiceError(errMsg)
    }
  }

  const findAddressByRequestId = async (
    requestId: OnChainAddressRequestId,
  ): Promise<OnChainAddressIdentifier | OnChainServiceError> => {
    try {
      const request = new FindAddressByExternalIdRequest()
      request.setExternalId(requestId)

      const response = await findAddressByExternalId(request, metadata)
      const foundAddress = response.getAddress()

      if (foundAddress === undefined) return new OnChainAddressNotFoundError()
      return {
        address: foundAddress.getAddress() as OnChainAddress,
      }
    } catch (err) {
      if (err.code == status.NOT_FOUND) {
        return new OnChainAddressNotFoundError()
      }
      const errMsg = typeof err === "string" ? err : err.message
      return new UnknownOnChainServiceError(errMsg)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.bria.onchain",
    fns: {
      getBalance,
      createOnChainAddress,
      findAddressByRequestId,
    },
  })
}

const translate = (rawEvent: RawBriaEvent): BriaEvent | BriaEventError => {
  const sequence = rawEvent.getSequence()
  const rawAugmentation = rawEvent.getAugmentation()

  if (!rawAugmentation) {
    return new EventAugmentationMissingError()
  }
  let augmentation: BriaEventAugmentation | undefined = undefined
  const rawInfo = rawAugmentation.getAddressInfo()
  if (rawInfo) {
    const info = rawInfo.toObject()
    augmentation = {
      addressInfo: {
        address: info.address as OnChainAddress,
        externalId: info.externalId,
      },
    }
  }
  if (augmentation === undefined) {
    return new ExpectedAddressInfoMissingInEventError()
  }

  let payload: BriaPayload | undefined
  let rawPayload
  switch (rawEvent.getPayloadCase()) {
    case RawBriaEvent.PayloadCase.PAYLOAD_NOT_SET:
      return new NoPayloadFoundError()
    case RawBriaEvent.PayloadCase.UTXO_DETECTED:
      rawPayload = rawEvent.getUtxoDetected()
      if (rawPayload === undefined) {
        return new ExpectedUtxoDetectedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.UtxoDetected,
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: rawPayload.getAddress() as OnChainAddress,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.UTXO_SETTLED:
      rawPayload = rawEvent.getUtxoSettled()
      if (rawPayload === undefined) {
        return new ExpectedUtxoSettledPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.UtxoSettled,
        txId: rawPayload.getTxId() as OnChainTxHash,
        vout: rawPayload.getVout() as OnChainTxVout,
        address: rawPayload.getAddress() as OnChainAddress,
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
        blockNumber: rawPayload.getBlockHeight(),
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_SUBMITTED:
      rawPayload = rawEvent.getPayoutSubmitted()
      if (rawPayload === undefined) {
        return new ExpectedPayoutSubmittedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutSubmitted,
        id: rawPayload.getId(),
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_COMMITTED:
      rawPayload = rawEvent.getPayoutCommitted()
      if (rawPayload === undefined) {
        return new ExpectedPayoutCommittedPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutCommitted,
        id: rawPayload.getId(),
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_BROADCAST:
      rawPayload = rawEvent.getPayoutBroadcast()
      if (rawPayload === undefined) {
        return new ExpectedPayoutBroadcastPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutBroadcast,
        id: rawPayload.getId(),
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    case RawBriaEvent.PayloadCase.PAYOUT_SETTLED:
      rawPayload = rawEvent.getPayoutSettled()
      if (rawPayload === undefined) {
        return new ExpectedPayoutSettledPayloadNotFoundError()
      }
      payload = {
        type: BriaPayloadType.PayoutSettled,
        id: rawPayload.getId(),
        satoshis: {
          amount: BigInt(rawPayload.getSatoshis()),
          currency: WalletCurrency.Btc,
        },
      }
      break
    default:
      return new UnknownPayloadTypeReceivedError()
  }

  return {
    payload,
    augmentation,
    sequence,
  }
}

export const KnownBriaErrorDetails = {
  DuplicateRequestIdAddressCreate:
    /duplicate key value violates unique constraint.*bria_addresses_account_id_external_id_key/,
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const constructMetadata = (metadataObj: { [key: string]: any }): Struct => {
  const metadata = new Struct()

  for (const key in metadataObj) {
    /* eslint-disable-next-line no-prototype-builtins */
    if (metadataObj.hasOwnProperty(key)) {
      const value = new Value()

      // Check the type of the value and set the appropriate field on the Value object
      const fieldValue = metadataObj[key]
      if (typeof fieldValue === "string") {
        value.setStringValue(fieldValue)
      } else if (typeof fieldValue === "number") {
        value.setNumberValue(fieldValue)
      } else if (typeof fieldValue === "boolean") {
        value.setBoolValue(fieldValue)
      } else if (Array.isArray(fieldValue)) {
        const listValue = new Value()
        listValue.setListValue(
          new ListValue().setValuesList(
            fieldValue.map((item) => {
              const listItemValue = new Value()
              listItemValue.setStringValue(item)
              return listItemValue
            }),
          ),
        )
        const fetchedListValue = listValue.getListValue()
        if (fetchedListValue !== undefined) {
          value.setListValue(fetchedListValue)
        }
      } else if (typeof fieldValue === "object") {
        value.setStructValue(constructMetadata(fieldValue))
      }

      metadata.getFieldsMap().set(key, value)
    }
  }

  return metadata
}
