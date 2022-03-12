import {
  CouldNotFindPhoneCodeError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"

import { PhoneCode } from "./schema"

export const PhoneCodesRepository = (): IPhoneCodesRepository => {
  const existNewerThan = async ({
    phone,
    code,
    age,
  }: {
    phone: PhoneNumber
    code: PhoneCode
    age: Seconds
  }): Promise<true | RepositoryError> => {
    const timestamp = (Date.now() - age * 1000) as MilliSeconds
    try {
      const phoneCode = await PhoneCode.findOne({
        phone,
        code,
        created_at: {
          $gte: timestamp,
        },
      })
      if (!phoneCode) {
        return new CouldNotFindPhoneCodeError()
      }
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const persistNew = async ({
    phone,
    code,
  }: {
    phone: PhoneNumber
    code: PhoneCode
  }): Promise<true | RepositoryError> => {
    try {
      await PhoneCode.create({ phone, code })
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    existNewerThan,
    persistNew,
  }
}
