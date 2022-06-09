import fs from "fs/promises"
import path from "path"

import prettier from "prettier"

export const writeSDLFile = async (filePath: string, content: string) => {
  const prettierConfig = await prettier.resolveConfig(__filename)
  if (!prettierConfig) {
    throw new Error("Prettier config not found")
  }
  const formattedContent = prettier.format(content, {
    ...prettierConfig,
    parser: "graphql",
  })
  return fs.writeFile(path.resolve(filePath), formattedContent)
}
