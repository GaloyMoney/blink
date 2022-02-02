import { GT } from "@graphql/index"
import IError from "@graphql/types/abstract/error"
import PsbtDetail from "@graphql/admin/types/object/psbt-detail"

const PsbtDetailPayload = GT.Object({
  name: "PsbtDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    psbtDetail: {
      type: PsbtDetail,
    },
  }),
})

export default PsbtDetailPayload
