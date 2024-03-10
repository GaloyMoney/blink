import { Admin } from "@/app"
import { GT } from "@/graphql"
import { mapError } from "@/graphql/error-map"
import CountryCode from "@/graphql/public/types/scalar/country-code"

const FilteredUserCountQuery = GT.Field({
  type: GT.NonNull(GT.Int),
  args: {
    userIdsFilter: {
      type: GT.List(GT.NonNullID),
    },
    phoneCountryCodesFilter: {
      type: GT.List(GT.NonNull(CountryCode)),
    },
  },
  resolve: async (_, args) => {
    const { userIdsFilter, phoneCountryCodesFilter } = args

    const nonErrorPhoneCountryCodesFilter: string[] = []
    for (const code of phoneCountryCodesFilter || []) {
      if (code instanceof Error) {
        throw code
      }
      nonErrorPhoneCountryCodesFilter.push(code)
    }

    const count = await Admin.filteredUserCount({
      userIdsFilter,
      phoneCountryCodesFilter: nonErrorPhoneCountryCodesFilter,
    })

    if (count instanceof Error) {
      throw mapError(count)
    }

    return count
  },
})

export default FilteredUserCountQuery
