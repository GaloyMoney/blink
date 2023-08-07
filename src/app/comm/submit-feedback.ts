import { ConfigError, env } from "@config"
import { MattermostError } from "@domain/comm/errors"
import { ErrorLevel } from "@domain/shared"
import { recordExceptionInCurrentSpan } from "@services/tracing"
import axios from "axios"

export const submitFeedback = async ({
  feedback,
  accountId,
  username,
}: {
  feedback: Feedback
  accountId: AccountId
  username?: Username
}) => {
  const mattermostWebhookUrl = env.MATTERMOST_WEBHOOK_URL
  if (!mattermostWebhookUrl) {
    recordExceptionInCurrentSpan({
      error: "missing MATTERMOST_WEBHOOK_URL",
      level: ErrorLevel.Critical,
    })
    return new ConfigError("missing MATTERMOST_WEBHOOK_URL")
  }

  const text = `Feedback from ${accountId}${
    username ? ` - ${username}` : ""
  }:\n\n${feedback}`

  try {
    const response = await axios.post(
      mattermostWebhookUrl,
      { text },
      { headers: { "Content-Type": "application/json" } },
    )

    if (response.status !== 200) {
      recordExceptionInCurrentSpan({
        error: "didn't successfully send feedback",
        attributes: { text },
        level: ErrorLevel.Critical,
      })
      return new MattermostError("feedback submit failed")
    }

    return true
  } catch (error) {
    recordExceptionInCurrentSpan({ error, level: ErrorLevel.Critical })
    return new MattermostError("feedback submit failed")
  }
}
