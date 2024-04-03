WorkspacePnpmToolchainInfo = provider(fields = [
  "build_workspace_node_modules",
  "build_node_modules",
  "build_npm_bin",
  "prepare_package_context",
  "compile_typescript",
  "package_prod_tsc_build",
  "package_prod_tsc_build_bin",
  "build_next_build",
  "package_next_bin",
  "run_npm_test",
  "run_audit",
  "graphql_codegen",
])

def workspace_pnpm_toolchain_impl(ctx) -> list[[DefaultInfo, WorkspacePnpmToolchainInfo]]:
    """
    A workspace aware Pnpm toolchain.
    """
    return [
        DefaultInfo(),
        WorkspacePnpmToolchainInfo(
            build_workspace_node_modules = ctx.attrs._build_workspace_node_modules,
            build_node_modules = ctx.attrs._build_node_modules,
            build_npm_bin = ctx.attrs._build_npm_bin,
            prepare_package_context = ctx.attrs._prepare_package_context,
            compile_typescript = ctx.attrs._compile_typescript,
            package_prod_tsc_build = ctx.attrs._package_prod_tsc_build,
            package_prod_tsc_build_bin = ctx.attrs._package_prod_tsc_build_bin,
            build_next_build = ctx.attrs._build_next_build,
            package_next_bin = ctx.attrs._package_next_bin,
            run_npm_test = ctx.attrs._run_npm_test,
            run_audit = ctx.attrs._run_audit,
            graphql_codegen = ctx.attrs._graphql_codegen,
        )
    ]

workspace_pnpm_toolchain = rule(
    impl = workspace_pnpm_toolchain_impl,
    attrs = {
        "_build_workspace_node_modules": attrs.dep(
            default = "toolchains//workspace-pnpm:build_workspace_node_modules.py",
        ),
        "_build_node_modules": attrs.dep(
            default = "toolchains//workspace-pnpm:build_node_modules.py",
        ),
        "_build_npm_bin": attrs.dep(
            default = "toolchains//workspace-pnpm:build_npm_bin.py",
        ),
        "_prepare_package_context": attrs.dep(
            default = "toolchains//workspace-pnpm:prepare_package_context.py",
        ),
        "_compile_typescript": attrs.dep(
            default = "toolchains//workspace-pnpm:compile_typescript.py",
        ),
        "_package_prod_tsc_build": attrs.dep(
            default = "toolchains//workspace-pnpm:package_prod_tsc_build.py",
        ),
        "_package_prod_tsc_build_bin": attrs.dep(
            default = "toolchains//workspace-pnpm:package_prod_tsc_build_bin.py",
        ),
        "_build_next_build": attrs.dep(
            default = "toolchains//workspace-pnpm:build_next_build.py",
        ),
        "_package_next_bin": attrs.dep(
            default = "toolchains//workspace-pnpm:package_next_bin.py",
        ),
        "_run_npm_test": attrs.dep(
            default = "toolchains//workspace-pnpm:run_npm_test.py",
        ),
        "_run_audit": attrs.dep(
            default = "toolchains//workspace-pnpm:run_audit.py",
        ),
        "_graphql_codegen": attrs.dep(
            default = "toolchains//workspace-pnpm:graphql_codegen.py",
        ),
    },
    is_toolchain_rule = True,
)
