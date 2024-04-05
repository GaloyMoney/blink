import { AssistantMock } from "./mock"
import { Assistant as AssistantFn } from "./assistant"

let Assistant: typeof AssistantFn | typeof AssistantMock

if (process.env.OPENAI_API_KEY && process.env.OPENAI_ASSISTANT_ID) {
  Assistant = AssistantFn
} else {
  Assistant = AssistantMock
}

export { Assistant }
