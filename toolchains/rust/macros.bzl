load(
    "@prelude//python:toolchain.bzl",
    "PythonToolchainInfo",
)
load(
    ":toolchain.bzl",
    "GaloyRustToolchainInfo",
)
load(
    "@prelude//test/inject_test_run_info.bzl",
    "inject_test_run_info",
)
load(
    "@prelude//tests:re_utils.bzl",
    "get_re_executor_from_props",
)

def galoy_rust_bin(
        name,
        srcs,
        deps,
        lib_root = "src/lib.rs",
        env = {},
        edition = "2021",
        visibility = ["PUBLIC"],
        extra_tests = [],
        protos = None):
    lib_name = "lib-{}".format(name)

    galoy_rust_lib(name = lib_name,
        srcs = srcs,
        deps = deps,
        lib_root = lib_root,
        env = env,
        edition = edition,
        visibility = visibility,
        extra_tests = extra_tests,
        protos = protos)

    native.rust_binary(
        name = name,
        deps = [
            ":lib-{}".format(name),
            "//third-party/rust:tokio",
            "//third-party/rust:anyhow",
        ],
        srcs = srcs,
        env = env,
        edition = edition,
        visibility = visibility,
        tests = [
            ":{}".format(lib_name),
            ":check-format-rust-bin",
            ":check-lint-rust-bin",
        ],
    )

    rustfmt_check(
        name = "check-format-rust-bin",
        srcs = srcs,
        crate_root = "src/main.rs",
    )

    clippy_check(
        name = "check-lint-rust-bin",
        clippy_txt_dep = ":{}[clippy.txt]".format(name),
    )


def galoy_rust_lib(
        name,
        srcs,
        deps,
        lib_root = "src/lib.rs",
        build_script = "build.rs",
        env = {},
        edition = "2021",
        visibility = ["PUBLIC"],
        extra_tests = [],
        protos = None,
        build_env = None):

    rustfmt_check(
        name = "check-format-rust-lib",
        srcs = srcs,
        crate_root = lib_root,
    )
    
    clippy_check(
        name = "check-lint-rust-lib",
        clippy_txt_dep = ":{}[clippy.txt]".format(name),
    )
    
    native.test_suite(
        name = "test",
        tests = [
            ":check-format-rust-lib",
            ":check-lint-rust-lib",
            ":test-unit-rust-lib"
        ],
    )

    if protos != None:
        build_name = name + "-build"
        proto_name = name + "-proto"

        native.rust_binary(
            name = build_name,
            srcs = [build_script],
            crate_root = build_script,
            deps = [
                "//third-party/rust:tonic-build"
            ],
        )

        build_env = build_env or {}
        # When using protoc included via buck:
        # build_env.update(
        #     {
        #         "PROTOC": "$(exe //third-party/proto:protoc)",
        #         "PROTOC_INCLUDE": "$(location //third-party/proto:google_protobuf)",
        #     },
        # )

        native.genrule(
          name = proto_name,
          srcs = protos,
          out = ".",
          cmd = "$(exe :" + build_name + ")",
          env = build_env,
        )

        env = env or {}
        env.update({
            "OUT_DIR": "$(location :{})".format(proto_name),
        })

    native.rust_test(
        name = "test-unit-rust-lib",
        edition = edition,
        srcs = srcs,
        crate_root = lib_root,
        deps = deps,
        env = env
    )

    native.rust_library(
        name = name,
        deps = deps,
        srcs = srcs,
        env = env,
        crate_root = lib_root,
        edition = edition,
        visibility = visibility,
        tests = [
            ":check-format-rust-lib",
            ":check-lint-rust-lib",
            ":test-unit-rust-lib"
        ] + extra_tests,
        features = ["fail-on-warnings"],
    )

def clippy_check_impl(ctx: AnalysisContext) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    clippy_txt = ctx.attrs.clippy_txt_dep[DefaultInfo].default_outputs

    galoy_rust_toolchain = ctx.attrs._galoy_rust_toolchain[GaloyRustToolchainInfo]

    run_cmd_args = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        galoy_rust_toolchain.clippy_output[DefaultInfo].default_outputs,
        clippy_txt,
    )

    args_file = ctx.actions.write("args.txt", run_cmd_args)

    return inject_test_run_info(
        ctx,
        ExternalRunnerTestInfo(
            type = "clippy",
            command = [run_cmd_args]
        ),
    ) + [
        DefaultInfo(default_output = args_file),
    ]

clippy_check = rule(
    impl = clippy_check_impl,
    attrs = {
        "clippy_txt_dep": attrs.dep(
            doc = """Clippy sub target dep from a Rust library or binary""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_galoy_rust_toolchain": attrs.toolchain_dep(
            default = "toolchains//:galoy_rust",
            providers = [GaloyRustToolchainInfo],
        ),
        "_inject_test_env": attrs.default_only(
            attrs.dep(default = "prelude//test/tools:inject_test_env"),
        ),
    },
)

def rustfmt_check_impl(ctx: AnalysisContext) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    galoy_rust_toolchain = ctx.attrs._galoy_rust_toolchain[GaloyRustToolchainInfo]
    crate_ctx = crate_context(ctx)

    run_cmd_args = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        galoy_rust_toolchain.rustfmt_check[DefaultInfo].default_outputs,
        "--config-path",
        galoy_rust_toolchain.rustfmt_toml[DefaultInfo].default_outputs,
        cmd_args(
            [crate_ctx.srcs_tree, ctx.label.package, ctx.attrs.crate_root],
            delimiter = "/",
        )
    )

    args_file = ctx.actions.write("args.txt", run_cmd_args)

    return inject_test_run_info(
        ctx,
        ExternalRunnerTestInfo(
            type = "rustfmt",
            command = [run_cmd_args],
        ),
    ) + [
        DefaultInfo(default_output = args_file),
    ]

rustfmt_check = rule(
    impl = rustfmt_check_impl,
    attrs = {
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """The set of Rust source files in the crate.""",
        ),
        "crate_root": attrs.string(
            doc = """Top level source file for the crate.""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_galoy_rust_toolchain": attrs.toolchain_dep(
            default = "toolchains//:galoy_rust",
            providers = [GaloyRustToolchainInfo],
        ),
        "_inject_test_env": attrs.default_only(
            attrs.dep(default = "prelude//test/tools:inject_test_env"),
        ),
    },
)

CrateContext = record(
    srcs_tree = field(Artifact),
)

def crate_context(ctx: AnalysisContext) -> CrateContext:
    srcs_tree = ctx.actions.declare_output("__src")

    galoy_rust_toolchain = ctx.attrs._galoy_rust_toolchain[GaloyRustToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        galoy_rust_toolchain.crate_context[DefaultInfo].default_outputs,
    )
    for src in ctx.attrs.srcs:
        cmd.add("--src")
        cmd.add(src)
    cmd.add(srcs_tree.as_output())

    ctx.actions.run(cmd, category = "crate_context")

    return CrateContext(
        srcs_tree = srcs_tree,
    )

