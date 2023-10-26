RustCompilerInfo = provider(
    doc = "Information about how to invoke the Rust compiler.",
    fields = ["compiler_path"],
)

def _rust_toolchain_impl(ctx):
    return [DefaultInfo(), RustCompilerInfo(compiler_path = ctx.attrs.command)]

rust_toolchain = rule(
    impl = _rust_toolchain_impl,
    is_toolchain_rule = True,
    attrs = {
        "command": attrs.string(),
    },
)
