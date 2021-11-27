import { update } from "@services/mongoose/users-admin"

export const updateUserLevel = async ({ uid, level }): Promise<UserAdmin | Error> => {
  return update({ id: uid, level })
}
