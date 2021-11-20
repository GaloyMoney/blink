import { VALIDITY_TIME_CODE } from "@config/app"
import {
  CouldNotFindPhoneCodeError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import moment from "moment"
import { PhoneCode } from "./schema"

export const PhoneCodesRepository = (): IPhoneCodesRepository => {
  const findRecent = async ({
    phone,
    code,
  }: {
    phone: PhoneNumber
    code: PhoneCode
  }): Promise<true | RepositoryError> => {
    try {
      const phoneCode = await PhoneCode.findOne({
        phone,
        code,
        created_at: {
          $gte: moment().subtract(VALIDITY_TIME_CODE, "seconds"),
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

  return {
    findRecent,
  }
}
