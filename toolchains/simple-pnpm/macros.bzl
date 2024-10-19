load("@prelude//python:toolchain.bzl", "PythonToolchainInfo",)

load(":toolchain.bzl", "SimplePnpmToolchainInfo",)

def build_node_modules(**kwargs):
    pnpm_lock = "pnpm-lock.yaml"
    if not rule_exists(pnpm_lock):
        native.export_file(
            name = "pnpm-lock.yaml"
        )
    package_json = "package.json"
    if not rule_exists(package_json):
        native.export_file(
            name = "package.json"
        )
    _build_node_modules(
        pnpm_lock = ":{}".format(pnpm_lock),
        package_json = ":{}".format(package_json),
        **kwargs,
    )

def build_node_modules_impl(ctx: AnalysisContext) -> list[DefaultInfo]:
    out = ctx.actions.declare_output("root", dir = True)

    simple_pnpm_toolchain = ctx.attrs._simple_pnpm_toolchain[SimplePnpmToolchainInfo]
    package_dir = cmd_args(ctx.label.package).relative_to(ctx.label.cell_root)

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        simple_pnpm_toolchain.build_node_modules[DefaultInfo].default_outputs,
        hidden = [ctx.attrs.pnpm_lock, ctx.attrs.package_json]
    )
    cmd.add("--root-dir")
    cmd.add(package_dir)

    cmd.add(out.as_output())

    ctx.actions.run(cmd, category = "pnpm", identifier = "install")

    return [DefaultInfo(default_output = out)]

_build_node_modules = rule(
    impl = build_node_modules_impl,
    attrs = {
        "pnpm_lock": attrs.source(
            doc = """Pnpm lock file""",
        ),
        "package_json": attrs.source(
            doc = """Package json file""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_simple_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:simple_pnpm",
            providers = [SimplePnpmToolchainInfo],
        ),
    },
)

def npm_bin_impl(ctx: AnalysisContext) -> list[[DefaultInfo, RunInfo, TemplatePlaceholderInfo]]:
    bin_name = ctx.attrs.bin_name or ctx.attrs.name

    exe = ctx.actions.declare_output(bin_name)

    simple_pnpm_toolchain = ctx.attrs._simple_pnpm_toolchain[SimplePnpmToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        simple_pnpm_toolchain.build_npm_bin[DefaultInfo].default_outputs,
        "--bin-out-path",
        exe.as_output(),
        ctx.attrs.node_modules,
        bin_name,
    )

    ctx.actions.run(cmd, category = "build_npm_bin", identifier = bin_name)

    return [
        DefaultInfo(default_output = exe),
        RunInfo(exe),
        TemplatePlaceholderInfo(
            keyed_variables = {
                "exe": exe,
            },
        ),
    ]

_npm_bin = rule(
    impl = npm_bin_impl,
    attrs = {
        "bin_name": attrs.option(
            attrs.string(),
            default = None,
            doc = """Node module bin name (default: attrs.name).""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds `node_modules`.""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_simple_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:simple_pnpm",
            providers = [SimplePnpmToolchainInfo],
        ),
    },
)

def npm_bin(
        node_modules = ":node_modules",
        **kwargs):
    _npm_bin(
        node_modules = node_modules,
        **kwargs,
    )
