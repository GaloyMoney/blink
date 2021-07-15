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
  oldPosition: Position
  newPosition: Position
}

export type Balance = {
  leverageRatio: number
  collateralInUsd: number
  exposureInUsd: number
  totalAccountValueInUsd: number
}

export type UpdatedBalance = {
  oldBalance: Balance
  newBalance: Balance
}

export interface IHedgingStrategy {
  UpdatePosition(
    liabilityInUsd: number,
    btcPriceInUsd: number,
  ): Promise<Result<UpdatedPosition>>
  UpdateLeverage(
    liabilityInUsd: number,
    btcPriceInUsd: number,
  ): Promise<Result<UpdatedBalance>>
}
