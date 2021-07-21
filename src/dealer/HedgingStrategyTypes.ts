import { Result } from "./Result"

export enum HedgingStrategies {
  FtxPerpetualSwap = "FtxPerpetualSwap",
  OkexPerpetualSwap = "OkexPerpetualSwap",
  OkexInverseFutures = "OkexInverseFutures",
}

export type Position = {
  leverageRatio: number
  collateralInUsd: number
  exposureInUsd: number
  totalAccountValueInUsd: number
}

export type UpdatedPosition = {
  originalPosition: Position
  newPosition: Position
}

export type UpdatedBalance = {
  originalLeverageRatio: number
  liabilityInUsd: number
  collateralInUsd: number
  newLeverageRatio: number
}

export interface WithdrawBookKeepingCallback {
  (transferSizeInBtc: number): Promise<Result<void>>
}

export interface DepositOnExchangeCallback {
  (onChainAddress, transferSizeInBtc: number): Promise<Result<void>>
}

export interface HedgingStrategy {
  UpdatePosition(
    liabilityInUsd: number,
    btcPriceInUsd: number,
  ): Promise<Result<UpdatedPosition>>
  UpdateLeverage(
    liabilityInUsd: number,
    btcPriceInUsd: number,
    withdrawFromExchangeOnChainAddress,
    withdrawBookKeepingCallback: WithdrawBookKeepingCallback,
    depositOnExchangeCallback: DepositOnExchangeCallback,
  ): Promise<Result<UpdatedBalance>>
}
