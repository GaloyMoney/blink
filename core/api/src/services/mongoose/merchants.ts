import { Merchant } from "./schema"
import { caseInsensitiveRegex, parseRepositoryError } from "./utils"

import {
  CouldNotFindMerchantFromIdError,
  CouldNotFindMerchantFromUsernameError,
} from "@/domain/errors"

interface IAccountRespotitory {
  listForMap(): Promise<BusinessMapMarker[] | RepositoryError>
  findByUsername(username: Username): Promise<BusinessMapMarker[] | RepositoryError>
  create({
    username,
    coordinates,
    title,
    validated,
  }: {
    username: Username
    coordinates: Coordinates
    title: BusinessMapTitle
    validated: boolean
  }): Promise<BusinessMapMarker | RepositoryError>
  update({
    id,
    coordinates,
    title,
    username,
    validated,
  }: {
    id: MerchantId
    coordinates: Coordinates
    title: BusinessMapTitle
    username: Username
    validated: boolean
  }): Promise<BusinessMapMarker | RepositoryError>
  remove(id: MerchantId): Promise<void | RepositoryError>
}

export const MerchantsRepository = (): IAccountRespotitory => {
  const findByUsername = async (
    username: Username,
  ): Promise<BusinessMapMarker[] | RepositoryError> => {
    try {
      const result = await Merchant.find({ username: caseInsensitiveRegex(username) })
      if (result.length === 0) {
        return new CouldNotFindMerchantFromUsernameError(username)
      }
      return result.map(translateToMerchant)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const listForMap = async (): Promise<BusinessMapMarker[] | RepositoryError> => {
    try {
      // only return merchants that have a location
      const merchants = await Merchant.find({ location: { $exists: true } })
      return merchants.map(translateToMerchant)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const create = async ({
    username,
    coordinates,
    title,
    validated,
  }: {
    username: Username
    coordinates: Coordinates
    title: BusinessMapTitle
    validated: boolean
  }): Promise<BusinessMapMarker | RepositoryError> => {
    try {
      const location = {
        type: "Point",
        coordinates: [coordinates.longitude, coordinates.latitude],
      }

      const result = await Merchant.create({ username, location, title, validated })

      return translateToMerchant(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const update = async ({
    id,
    coordinates,
    title,
    username,
    validated,
  }: {
    id: MerchantId
    coordinates: Coordinates
    title: BusinessMapTitle
    username: Username
    validated: boolean
  }) => {
    const result = await Merchant.findOneAndUpdate(
      { id },
      { coordinates, title, username, validated },
      { new: true },
    )
    if (!result) {
      return new CouldNotFindMerchantFromIdError(id)
    }

    return translateToMerchant(result)
  }

  const remove = async (id: MerchantId): Promise<void | RepositoryError> => {
    try {
      const result = await Merchant.deleteOne({ id })
      if (!result) {
        return new CouldNotFindMerchantFromIdError(id)
      }
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const translateToMerchant = (merchant: MerchantRecord): BusinessMapMarker => {
    const coordinatesTable = merchant.location.coordinates
    const coordinates: Coordinates = {
      longitude: coordinatesTable[0],
      latitude: coordinatesTable[1],
    }

    return {
      id: merchant.id as MerchantId,
      username: merchant.username as Username,
      title: merchant.title as BusinessMapTitle,
      coordinates,
      validated: merchant.validated,
      createdAt: merchant.createdAt,
    }
  }

  return {
    listForMap,
    findByUsername,
    create,
    update,
    remove,
  }
}
