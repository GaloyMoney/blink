import { revalidatePath } from "next/cache"

import {
  AuditedAccount,
  BusinessDeleteMapInfoDocument,
  BusinessDeleteMapInfoMutation,
  BusinessDeleteMapInfoMutationVariables,
  BusinessUpdateMapInfoDocument,
  BusinessUpdateMapInfoMutation,
  BusinessUpdateMapInfoMutationVariables,
} from "../../generated"

import { getClient } from "../../app/graphql-rsc"

import ConfirmForm from "./confirm"

const isValidLatitude = (latitude: number) =>
  isFinite(latitude) && Math.abs(latitude) <= 90
const isValidLongitude = (longitude: number) =>
  isFinite(longitude) && Math.abs(longitude) <= 180
const isValidTitle = (title: string) => title.length >= 3

const deleteBusiness = async (formData: FormData) => {
  "use server"

  const username = formData.get("username") as string

  await getClient().mutate<
    BusinessDeleteMapInfoMutation,
    BusinessDeleteMapInfoMutationVariables
  >({
    mutation: BusinessDeleteMapInfoDocument,
    variables: { input: { username } },
  })

  revalidatePath("/account")
}

const update = async (formData: FormData) => {
  "use server"

  const username = String(formData.get("username"))
  const title = String(formData.get("title"))
  const latitude = Number(formData.get("latitude"))
  const longitude = Number(formData.get("longitude"))

  if (
    !!title &&
    isValidTitle(title) &&
    username &&
    isValidLatitude(latitude) &&
    isValidLongitude(longitude)
  ) {
    const input = { username, title, latitude, longitude }

    await getClient().mutate<
      BusinessUpdateMapInfoMutation,
      BusinessUpdateMapInfoMutationVariables
    >({
      mutation: BusinessUpdateMapInfoDocument,
      variables: { input },
    })
  }

  revalidatePath("/account")
}

const BusinessMapUpdate: React.FC<{
  auditedAccount: AuditedAccount
}> = ({ auditedAccount }) => {
  return (
    <div className="shadow p-6 min-w-0 rounded-lg shadow-xs overflow-hidden bg-white grid grid-cols-1 gap-4">
      <form className="grid grid-cols-2 gap-4" action={update}>
        <div>
          <input
            id="username"
            name="username"
            hidden
            value={auditedAccount.username ?? ""}
          />
          <label htmlFor="latitude" className="font-semibold text-gray-600">
            Latitude
          </label>
          <input
            id="latitude"
            name="latitude"
            required
            type="text"
            pattern="^(-|\+)??(90(\.0+?)??|([0-8]??\d)(\.\d+?)??)$"
            placeholder="Enter longitude"
            className={`mt-4 shadow appearance-none border rounded w-full py-2 px-3 text-gray-600 focus:outline-none focus:shadow-outline`}
          />
        </div>
        <div>
          <label htmlFor="longitude" className="font-semibold text-gray-600">
            Longitude
          </label>
          <input
            id="longitude"
            name="longitude"
            required
            type="text"
            pattern="^[-+]?(180(\.0{1,6})?|((\d{1,2}|[0-9][0-9][0-9])?(\.\d{1,12})?))$"
            placeholder="Enter longitude"
            className={`mt-4 shadow appearance-none border rounded w-full py-2 px-3 text-gray-600 focus:outline-none focus:shadow-outline`}
          />
        </div>
        <div>
          <label htmlFor="title" className="font-semibold text-gray-600">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            type="text"
            pattern="^.{3,}$"
            placeholder="Enter title"
            className={`
             mt-4 shadow appearance-none border rounded w-full py-2 px-3 text-gray-600 focus:outline-none focus:shadow-outline`}
          />
        </div>
        <div className={`flex items-end justify-end`}>
          <button
            type="submit"
            className="mb-0 w-full bg-blue-400 hover:bg-blue-500 text-white font-bold p-2 my-4 border border-blue-500 rounded disabled:opacity-50"
          >
            {"Update"}
          </button>
        </div>
      </form>
      <ConfirmForm
        action={deleteBusiness}
        message="Are you sure you want to remove this business from the map?"
      >
        <input type="hidden" name="username" value={auditedAccount.username ?? ""} />
        <div className={`flex items-end justify-end`}>
          <button
            disabled={
              auditedAccount.username === undefined || auditedAccount.username === null
            }
            type="submit"
            className="mb-0 w-full bg-blue-400 hover:bg-red-500 text-white font-bold p-2 my-4 border border-blue-500 rounded disabled:opacity-50"
          >
            {"Delete"}
          </button>
        </div>
      </ConfirmForm>
    </div>
  )
}

export default BusinessMapUpdate
