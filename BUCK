load("@toolchains//workspace-pnpm:macros.bzl", "pnpm_workspace", "build_workspace_node_modules")

pnpm_workspace(
  name = "workspace",
  child_packages = [
    "//core/api:package.json",
    "//apps/consent:package.json",
    "//apps/dashboard:package.json",
    "//apps/pay:package.json",
    "//apps/admin-panel:package.json",
    "//apps/map:package.json",
    "//apps/voucher:package.json",
    "//lib/eslint-config:package.json",
    "//lib/galoy-components:package.json"
  ],
  visibility = ["PUBLIC"],
)

export_file(
    name = "rustfmt.toml",
    visibility = ["PUBLIC"],
)

build_workspace_node_modules(
    name = "node_modules",
    visibility = ["PUBLIC"],
)
