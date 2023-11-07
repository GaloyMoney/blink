load("@prelude//python:toolchain.bzl", "PythonToolchainInfo",)
load(":toolchain.bzl", "RoverToolchainInfo",)

SdlInfo = provider(fields = [
  "schema",
  "path",
])

def sdl_impl(ctx: AnalysisContext) -> list[[DefaultInfo, SdlInfo]]:
    schema_out_path = ctx.label.package + "/" + ctx.attrs.output

    out = ctx.actions.declare_output(schema_out_path)

    rover_toolchain = ctx.attrs._rover_toolchain[RoverToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        rover_toolchain.output_sdl[DefaultInfo].default_outputs,
        "--generator-bin",
        ctx.attrs.generator[RunInfo],
        out.as_output()
    )

    ctx.actions.run(cmd, category = "sdl")
    return [DefaultInfo(default_output = out), SdlInfo(schema = out, path = schema_out_path)]

sdl = rule(
    impl = sdl_impl,
    attrs = {
        "generator": attrs.dep(
            providers = [RunInfo],
            doc = """Generator that will output the sdl""",
        ),
        "output": attrs.string(
            default = "schema.graphql",
            doc = """Output file to write the sdl to""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_rover_toolchain": attrs.toolchain_dep(
            default = "toolchains//:rover",
            providers = [RoverToolchainInfo],
        ),
    },
)
