import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import SuccessPayload from "@graphql/types/payload/success-payload"
import Feedback from "@graphql/types/scalar/feedback"
import { Comm } from "@app"

const FeedbackSubmitInput = GT.Input({
  name: "FeedbackSubmitInput",
  fields: () => ({
    feedback: { type: GT.NonNull(Feedback) },
  }),
})

const FeedbackSubmitMutation = GT.Field<
  {
    input: {
      feedback: Feedback | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(FeedbackSubmitInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { feedback } = args.input

    if (feedback instanceof Error) {
      return { errors: [{ message: feedback.message }] }
    }

    const success = await Comm.submitFeedback({
      feedback,
      accountId: domainAccount.id,
      username: domainAccount.username,
    })

    if (success instanceof Error) {
      return { status: "failed", errors: [mapAndParseErrorForGqlResponse(success)] }
    }

    return {
      errors: [],
      success,
    }
  },
})

export default FeedbackSubmitMutation
