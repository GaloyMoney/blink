load("@prelude//python:toolchain.bzl", "PythonToolchainInfo",)
load(":toolchain.bzl", "WorkspacePnpmToolchainInfo",)

def tsc_build_impl(ctx: AnalysisContext) -> list[[DefaultInfo, RunInfo]]:
    build_context = prepare_build_context(ctx)
    return [
        DefaultInfo(build_context.workspace_root),
        RunInfo("dummy"),
    ]

def tsc_build(
    node_modules = ":node_modules",
    **kwargs):
    _tsc_build(
        node_modules = node_modules,
        **kwargs,
    )

_tsc_build = rule(
    impl = tsc_build_impl,
    attrs = {
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of package source files to track.""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds package `node_modules`.""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

BuildContext = record(
    workspace_root = field(Artifact),
)


def prepare_build_context(ctx: AnalysisContext) -> BuildContext:
    workspace_root = ctx.actions.declare_output("__workspace")

    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]
    package_dir = cmd_args(ctx.label.package).relative_to(ctx.label.cell_root)

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.prepare_build_context[DefaultInfo].default_outputs,
        "--package-dir",
        package_dir,
        "--node-modules-path",
        ctx.attrs.node_modules,
    )
    for src in ctx.attrs.srcs:
        cmd.add("--src")
        cmd.add(cmd_args(src, format = ctx.label.package + "={}"))
    # needed when we have workspace level dependencies
    # for (name, src) in ctx.attrs.prod_deps_srcs.items():
    #     cmd.add("--src")
    #     cmd.add(cmd_args(src, format = name + "={}"))
    # for (name, src) in ctx.attrs.dev_deps_srcs.items():
    #     cmd.add("--src")
    #     cmd.add(cmd_args(src, format = name + "={}"))
    cmd.add(workspace_root.as_output())

    ctx.actions.run(cmd, category = "prepare_build_context")

    return BuildContext(
        workspace_root = workspace_root,
    )
