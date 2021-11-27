import { RepositoryError, UnknownRepositoryError } from "@domain/errors"
import { User } from "@services/mongoose/schema"

export const update = async ({
  id,
  level,
  status,
}: {
  id: UserId
  level: AccountLevel
  status: AccountStatus
}): Promise<UserAdmin | Error> => {
  try {
    const result = await User.findOneAndUpdate(
      { _id: id },
      { level, status },
      {
        level: 1,
        status: 1,
      },
    )
    if (!result) {
      return new RepositoryError("Couldn't update user")
    }
    return userAdminFromRaw(result)
  } catch (err) {
    return new UnknownRepositoryError(err)
  }
}

const userAdminFromRaw = (result: UserType): UserAdmin => ({
  id: result.id as UserId,
  level: result.level as AccountLevel,
  status: result.status as AccountStatus,
})
