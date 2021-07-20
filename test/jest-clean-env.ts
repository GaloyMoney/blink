import Environment from "jest-environment-node"
import { ProjectConfig } from "@jest/types/build/Config"

class CleanEnvironment extends Environment {
  constructor(config: ProjectConfig) {
    super(config)
  }
  async setup() {
    await super.setup()
    this.global.stopMongoose = true
  }
}

module.exports = CleanEnvironment
