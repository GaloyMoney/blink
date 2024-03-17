import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function main() {
  //   const assistants = await openai.beta.assistants.list()
  //   console.dir(assistants.data, { depth: null })

  //   const thread = await openai.beta.threads.create()
  //   console.log(thread)

  const thread = await openai.beta.threads.retrieve("thread_Z7DUx4JluFs2AyI9RuCuPG2o")
  console.dir(thread, { depth: null })

  const country = "El Salvador"
  const level = 1
  const content = "Hello, world!"

  //   const threadId = thread.id

  //   const res2 = await openai.beta.threads.messages.create(threadId, {
  //     role: "user",
  //     content,
  //   })
  //   console.log(res2, "res2")

  //   const res = await openai.beta.threads.runs.create(threadId, {
  //     additional_instructions: `This user has a phone number from ${country} and is at level ${level}.`,
  //     assistant_id: "asst_3mWyMcTAn0xgVgDuDmon4jSG",
  //   })

  //   console.log(res, "res")

  // console.dir(await openai.beta.threads.messages.list(thread.id), { depth: null })

  // const message = await openai.beta.threads.messages.create(thread.id, {
  //   role: "user",
  //   content: "I need to solve the equation `3x + 11 = 14`. Can you help me?",
  // })

  const message = await openai.beta.threads.messages.list(thread.id)
  console.dir(message.data, { depth: null })

  // const run = await openai.beta.threads.runs.create(thread.id, {
  //   assistant_id: "asst_3mWyMcTAn0xgVgDuDmon4jSG",
  // })

  // const result = await openai.beta.threads.messages.create("test", {
  //   content: "test",
  //   role: "user",
  // })

  // console.log(result)

  //   const chatCompletion = await openai.chat.completions.create({
  //     messages: [{ role: "user", content: "Say this is a test" }],
  //     model: "gpt-3.5-turbo",
  //   })

  //   console.dir(chatCompletion, { depth: null })
  //   console.log("done")
}

main()
