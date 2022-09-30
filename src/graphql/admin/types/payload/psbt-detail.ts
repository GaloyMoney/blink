import { GT } from "@graphql/index"
import AppError from "@graphql/types/object/app-error"
import PsbtDetail from "@graphql/admin/types/object/psbt-detail"

const PsbtDetailPayload = GT.Object({
  name: "PsbtDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    psbtDetail: {
      type: PsbtDetail,
    },
  }),
})

export default PsbtDetailPayload
