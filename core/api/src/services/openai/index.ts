import { AssistantMock } from "./mock"
import { Assistant as AssistantFn } from "./assistant"
import { textToVector } from "./embeddings"

let Assistant: typeof AssistantFn | typeof AssistantMock

if (process.env.OPENAI_API_KEY && process.env.OPENAI_ASSISTANT_ID) {
  Assistant = AssistantFn
} else {
  Assistant = AssistantMock
}

export { Assistant, textToVector }
