load(
    "@prelude//test/inject_test_run_info.bzl",
    "inject_test_run_info",
)

load("@prelude//python:toolchain.bzl", "PythonToolchainInfo",)
load(":toolchain.bzl", "GraphqlCodegenToolchainInfo",)

def graphql_codegen_impl(ctx: AnalysisContext) -> list[DefaultInfo]:
    out = ctx.actions.declare_output("codegen-out", dir = True)

    codegen_toolchain = ctx.attrs._codegen_toolchain[GraphqlCodegenToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        codegen_toolchain.codegen[DefaultInfo].default_outputs,
        "--graphql-codegen-bin",
        ctx.attrs.graphql_codegen_bin[RunInfo],
        "--config",
        ctx.attrs.config
    )
    for schema in ctx.attrs.schemas:
        cmd.add(
            "--schema",
            cmd_args(schema),
        )
    cmd.add(out.as_output())

    ctx.actions.run(cmd, category = "codegen")
    return [DefaultInfo(default_output = out)]

graphql_codegen = rule(
    impl = graphql_codegen_impl,
    attrs = {
        "schemas": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of all schemas""",
        ),
        "config": attrs.source(
            doc = """Configuration file to use for codegen""",
        ),
        "graphql_codegen_bin": attrs.dep(
            providers = [RunInfo],
            default = "root//third-party/node/graphql-codegen:graphql_codegen_bin",
            doc = """Graphql Codegen dependency.""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_codegen_toolchain": attrs.toolchain_dep(
            default = "toolchains//:graphql_codegen",
            providers = [GraphqlCodegenToolchainInfo],
        ),
    },
)
