import { Metadata, status } from "@grpc/grpc-js"
import { Struct, Value, ListValue } from "google-protobuf/google/protobuf/struct_pb"

import { getBriaConfig } from "@config"

import {
  OnChainAddressAlreadyCreatedForRequestIdError,
  OnChainAddressNotFoundError,
  UnknownOnChainServiceError,
} from "@domain/bitcoin/onchain"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared/primitives"

import { baseLogger } from "@services/logger"
import { wrapAsyncToRunInSpan, wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { GrpcStreamClient } from "@utils"

import {
  findAddressByExternalId,
  getWalletBalanceSummary,
  newAddress,
  subscribeAll,
} from "./grpc-client"
import {
  SubscribeAllRequest,
  BriaEvent as RawBriaEvent,
  NewAddressRequest,
  GetWalletBalanceSummaryRequest,
  FindAddressByExternalIdRequest,
} from "./proto/bria_pb"
import { UnknownBriaEventError } from "./errors"
export { BriaPayloadType } from "./event-handler"
import { BriaEventRepo } from "./event-repository"
import { eventDataHandler } from "./event-handler"

const briaConfig = getBriaConfig()
const { streamBuilder, FibonacciBackoff } = GrpcStreamClient

export const BriaSubscriber = () => {
  const metadata = new Metadata()
  metadata.set("x-bria-api-key", briaConfig.apiKey)

  const subscribeToAll = async (
    eventHandler: BriaEventHandler,
  ): Promise<Stream<RawBriaEvent> | BriaEventError> => {
    try {
      const lastSequence = await BriaEventRepo().getLatestSequence()
      if (lastSequence instanceof Error) {
        return lastSequence
      }

      const request = new SubscribeAllRequest()
      request.setAugment(true)
      request.setAfterSequence(lastSequence)

      const onDataHandler = wrapAsyncToRunInSpan({
        root: true,
        namespace: "service.bria",
        fnName: "subscribeToAllHandler",
        fn: eventDataHandler(eventHandler),
      })

      return streamBuilder<RawBriaEvent, SubscribeAllRequest>(subscribeAll)
        .withOptions({ retry: true, acceptDataOnReconnect: false })
        .withRequest(request)
        .withMetadata(metadata)
        .onData(onDataHandler)
        .onError(async (stream, error) => {
          baseLogger.info({ error }, "Error subscribeToAll stream")
          const sequence = await BriaEventRepo().getLatestSequence()
          if (sequence instanceof Error) {
            // worst case it will reprocess some events
            baseLogger.error({ error: sequence }, "Error getting last sequence")
            return
          }
          stream.request.setAfterSequence(sequence)
        })
        .onRetry((_, { detail }) =>
          baseLogger.info({ ...detail }, "Retry subscribeToAll stream"),
        )
        .withBackoff(new FibonacciBackoff(30000, 7))
        .build()
    } catch (error) {
      return new UnknownBriaEventError(error.message || error)
    }
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
    walletDescriptor,
    requestId,
  }: {
    walletDescriptor: WalletDescriptor<WalletCurrency>
    requestId?: OnChainAddressRequestId
  }): Promise<OnChainAddressIdentifier | OnChainServiceError> => {
    try {
      const request = new NewAddressRequest()
      request.setWalletName(briaConfig.walletName)
      request.setMetadata(
        constructMetadata({ galoy: { walletDetails: walletDescriptor } }),
      )
      if (requestId) {
        request.setExternalId(requestId)
      }

      const response = await newAddress(request, metadata)
      return { address: response.getAddress() as OnChainAddress }
    } catch (err) {
      if (err.code === status.ALREADY_EXISTS) {
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

export const KnownBriaErrorDetails = {
  DuplicateRequestIdAddressCreate:
    /duplicate key value violates unique constraint.*bria_addresses_account_id_external_id_key/,
} as const

const constructMetadata = (metadataObj: JSONObject): Struct => {
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
              listItemValue.setStringValue(`${item}`)
              return listItemValue
            }),
          ),
        )
        const fetchedListValue = listValue.getListValue()
        if (fetchedListValue !== undefined) {
          value.setListValue(fetchedListValue)
        }
      } else if (typeof fieldValue === "object") {
        value.setStructValue(constructMetadata(fieldValue as JSONObject))
      }

      metadata.getFieldsMap().set(key, value)
    }
  }

  return metadata
}
