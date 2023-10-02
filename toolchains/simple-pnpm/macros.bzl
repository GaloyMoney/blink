load("@prelude//python:toolchain.bzl", "PythonToolchainInfo",)

load(":toolchain.bzl", "SimplePnpmToolchainInfo",)

def build_node_modules_impl(ctx: AnalysisContext) -> list[DefaultInfo]:
    out = ctx.actions.declare_output("root", dir = True)

    simple_pnpm_toolchain = ctx.attrs._simple_pnpm_toolchain[SimplePnpmToolchainInfo]
    package_dir = cmd_args(ctx.label.package).relative_to(ctx.label.cell_root)

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        simple_pnpm_toolchain.build_node_modules[DefaultInfo].default_outputs,
    )
    cmd.add("--root-dir")
    cmd.add(package_dir)

    cmd.add(out.as_output())
    cmd.hidden([ctx.attrs.pnpm_lock])

    ctx.actions.run(cmd, category = "pnpm", identifier = "install")

    return [DefaultInfo(default_output = out)]

build_node_modules = rule(
    impl = build_node_modules_impl,
    attrs = {
        "pnpm_lock": attrs.source(
            doc = """Pnpm lock file""",
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

