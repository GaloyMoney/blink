WorkspacePnpmToolchainInfo = provider(fields = [
  "prepare_build_context",
])

def workspace_pnpm_toolchain_impl(ctx) -> list[[DefaultInfo, WorkspacePnpmToolchainInfo]]:
    """
    A workspace aware Pnpm toolchain.
    """
    return [
        DefaultInfo(),
        WorkspacePnpmToolchainInfo(
            prepare_build_context = ctx.attrs._prepare_build_context,
        )
    ]

workspace_pnpm_toolchain = rule(
    impl = workspace_pnpm_toolchain_impl,
    attrs = {
        "_prepare_build_context": attrs.dep(
            default = "toolchains//workspace-pnpm:prepare_build_context.py",
        ),
    },
    is_toolchain_rule = True,
)
