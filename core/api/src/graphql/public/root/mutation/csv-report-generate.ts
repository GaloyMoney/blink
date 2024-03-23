import CsvReportGeneratePayload from "@/graphql/public/types/payload/csv-report-generate"
import CSVReportGenerateChannel from "@/graphql/public/types/scalar/csv-report-generate-channel"
import { Accounts } from "@/app"
import { GT } from "@/graphql/index"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

const CSVReportGenerateInput = GT.Input({
  name: "CSVReportGenerateInput",
  fields: () => ({
    channel: { type: CSVReportGenerateChannel },
  }),
})

const CSVReportGenerate = GT.Field<
  null,
  GraphQLPublicContextAuth,
  { input: { channel: string } }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(CsvReportGeneratePayload),
  args: {
    input: { type: CSVReportGenerateInput },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { channel: channelInput } = args.input || { channel: "InlineBase64CSV" }
    const channel = channelInput

    if (channel !== "InlineBase64CSV") {
      return { errors: [{ message: "Invalid channel" }] }
    }

    const content = await Accounts.getCSVForAccount(domainAccount.id)

    if (content instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(content)] }
    }

    return {
      errors: [],
      content,
    }
  },
})

export default CSVReportGenerate
