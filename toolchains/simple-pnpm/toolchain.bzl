SimplePnpmToolchainInfo = provider(fields = [
  "build_node_modules",
  "build_npm_bin",
])

def simple_pnpm_toolchain_impl(ctx) -> list[[DefaultInfo, SimplePnpmToolchainInfo]]:
    """
    A Pnpm toolchain.
    """
    return [
        DefaultInfo(),
        SimplePnpmToolchainInfo(
            build_node_modules = ctx.attrs._build_node_modules,
            build_npm_bin = ctx.attrs._build_npm_bin,
        )
    ]

simple_pnpm_toolchain = rule(
    impl = simple_pnpm_toolchain_impl,
    attrs = {
        "_build_node_modules": attrs.dep(
            default = "toolchains//simple-pnpm:build_node_modules.py",
        ),
        "_build_npm_bin": attrs.dep(
            default = "toolchains//simple-pnpm:build_npm_bin.py",
        ),
    },
    is_toolchain_rule = True,
)
