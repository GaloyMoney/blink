load("@toolchains//workspace-pnpm:macros.bzl", "pnpm_workspace")

pnpm_workspace(
  name = "workspace",
  child_packages = [
    "//core/api:package.json",
    "//apps/consent:package.json",
    "//apps/dashboard:package.json",
    "//lib/eslint-config:package.json"
    "//lib/gt3-server-node-express-sdk:package.json"
  ],
  visibility = ["PUBLIC"],
)
