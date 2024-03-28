GraphqlCodegenToolchainInfo = provider(fields = [
  "codegen",
])

def graphql_codegen_toolchain_impl(ctx) -> list[[DefaultInfo, GraphqlCodegenToolchainInfo]]:
    """
    A toolchain for Rover.
    """
    return [
        DefaultInfo(),
        GraphqlCodegenToolchainInfo(
            codegen = ctx.attrs._codegen,
        )
    ]

graphql_codegen_toolchain = rule(
    impl = graphql_codegen_toolchain_impl,
    attrs = {
        "_codegen": attrs.dep(
            default = "toolchains//graphql-codegen:codegen.py",
        ),
    },
    is_toolchain_rule = True,
)
