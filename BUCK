load("@toolchains//workspace-pnpm:macros.bzl", "pnpm_workspace")

pnpm_workspace(
  name = "workspace",
  child_packages = [
    "//core/api:package.json",
    "//apps/consent:package.json",
    "//apps/dashboard:package.json"
  ],
  visibility = ["PUBLIC"],
)
