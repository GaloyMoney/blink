GaloyRustToolchainInfo = provider(
    fields = {
        "clippy_output": typing.Any,
        "crate_context": typing.Any,
        "rustfmt_check": typing.Any,
        "rustfmt_toml": typing.Any
    },
)


def galoy_rust_toolchain_impl(ctx) -> list[[DefaultInfo, GaloyRustToolchainInfo]]:
    """
    An extended Rust toolchain.
    """
    return [
        DefaultInfo(),
        GaloyRustToolchainInfo(
            clippy_output = ctx.attrs._clippy_output,
            crate_context = ctx.attrs._crate_context,
            rustfmt_check = ctx.attrs._rustfmt_check,
            rustfmt_toml = ctx.attrs._rustfmt_toml,
        ),
    ]

galoy_rust_toolchain = rule(
    impl = galoy_rust_toolchain_impl,
    attrs = {
        "_rustfmt_toml": attrs.dep(
            default = "root//:rustfmt.toml"
        ),
        "_clippy_output": attrs.dep(
            default = "toolchains//rust:clippy_output.py",
        ),
        "_crate_context": attrs.dep(
            default = "toolchains//rust:crate_context.py",
        ),
        "_rustfmt_check": attrs.dep(
            default = "toolchains//rust:rustfmt_check.py",
        ),
    },
    is_toolchain_rule = True,
)
