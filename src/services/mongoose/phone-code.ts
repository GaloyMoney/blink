import { CouldNotFindPhoneCodeError, RepositoryError } from "@domain/errors"

import { parseRepositoryError } from "./utils"
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
      return parseRepositoryError(err)
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
      return parseRepositoryError(err)
    }
  }

  return {
    existNewerThan,
    persistNew,
  }
}
