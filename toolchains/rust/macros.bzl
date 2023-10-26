load(":toolchain.bzl", "RustCompilerInfo")

def _rust_binary_impl(ctx):
    out = ctx.actions.declare_output("main")

    cmd = cmd_args([
        ctx.attrs._rust_toolchain[RustCompilerInfo].compiler_path,
        "--crate-type=bin",
        ctx.attrs.file,
        "-o",
        out.as_output(),
    ])

    ctx.actions.run(cmd, category = "compile")

    return [DefaultInfo(default_output = out), RunInfo(args = cmd_args([out]))]

rust_binary = rule(
    impl = _rust_binary_impl,
    attrs = {
        "file": attrs.source(),
        "_rust_toolchain": attrs.toolchain_dep(
            default = "toolchains//:rust",
            providers = [RustCompilerInfo],
        ),
    },
)
