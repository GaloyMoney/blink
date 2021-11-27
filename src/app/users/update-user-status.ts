import { update } from "@services/mongoose/users-admin"

export const updateUserAccountStatus = async ({
  uid,
  status,
}): Promise<UserAdmin | Error> => {
  return update({ id: uid, status })
}
