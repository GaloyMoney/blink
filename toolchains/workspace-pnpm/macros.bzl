# move to workspace toolchain
load("@toolchains//simple-pnpm:macros.bzl", "npm_bin")

load("@prelude//python:toolchain.bzl", "PythonToolchainInfo",)
load(":toolchain.bzl", "WorkspacePnpmToolchainInfo",)

def tsc_build_impl(ctx: AnalysisContext) -> list[DefaultInfo]:
    build_context = prepare_build_context(ctx)

    out = ctx.actions.declare_output("dist", dir = True)
    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.compile_typescript[DefaultInfo].default_outputs,
        "--package-dir",
        cmd_args([build_context.workspace_root, ctx.label.package], delimiter = "/"),
        "--tsc-bin",
        cmd_args(ctx.attrs.tsc[RunInfo]),
        "--tsconfig",
        cmd_args(ctx.attrs.tsconfig),
        "--tscpaths-bin",
        cmd_args(ctx.attrs.tscpaths[RunInfo]),
        cmd_args(out.as_output()),
    )

    ctx.actions.run(cmd, category = "tsc")

    return [
        DefaultInfo(default_output = out),
    ]

def tsc_build(
    node_modules = ":node_modules",
    **kwargs):
    tsc_bin = "tsc_bin"
    if not rule_exists(tsc_bin):
        npm_bin(
            name = tsc_bin,
            bin_name = "tsc",
        )
    tscpaths_bin = "tscpaths_bin"
    if not rule_exists(tscpaths_bin):
        npm_bin(
            name = tscpaths_bin,
            bin_name = "tscpaths",
        )
    _tsc_build(
        tsc = ":{}".format(tsc_bin),
        tscpaths = ":{}".format(tscpaths_bin),
        node_modules = node_modules,
        **kwargs,
    )

_tsc_build = rule(
    impl = tsc_build_impl,
    attrs = {
        "tsc": attrs.dep(
            providers = [RunInfo],
            doc = """TypeScript compiler dependency.""",
        ),
        "tsconfig": attrs.string(
            doc = """Target which builds `tsconfig.json`.""",
        ),
        "tscpaths": attrs.dep(
            providers = [RunInfo],
            doc = """tscpaths dependency.""",
        ),
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
    workspace_root = ctx.actions.declare_output("__workspace", dir = True)

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
