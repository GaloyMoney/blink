WorkspacePnpmToolchainInfo = provider(fields = [
  "prepare_build_context",
  "compile_typescript",
])

def workspace_pnpm_toolchain_impl(ctx) -> list[[DefaultInfo, WorkspacePnpmToolchainInfo]]:
    """
    A workspace aware Pnpm toolchain.
    """
    return [
        DefaultInfo(),
        WorkspacePnpmToolchainInfo(
            prepare_build_context = ctx.attrs._prepare_build_context,
            compile_typescript = ctx.attrs._compile_typescript,
        )
    ]

workspace_pnpm_toolchain = rule(
    impl = workspace_pnpm_toolchain_impl,
    attrs = {
        "_prepare_build_context": attrs.dep(
            default = "toolchains//workspace-pnpm:prepare_build_context.py",
        ),
        "_compile_typescript": attrs.dep(
            default = "toolchains//workspace-pnpm:compile_typescript.py",
        ),
    },
    is_toolchain_rule = True,
)
