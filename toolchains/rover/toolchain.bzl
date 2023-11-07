RoverToolchainInfo = provider(fields = [
  "output_sdl",
])

def rover_toolchain_impl(ctx) -> list[[DefaultInfo, RoverToolchainInfo]]:
    """
    A toolchain for Rover.
    """
    return [
        DefaultInfo(),
        RoverToolchainInfo(
            output_sdl = ctx.attrs._output_sdl,
        )
    ]

rover_toolchain = rule(
    impl = rover_toolchain_impl,
    attrs = {
        "_output_sdl": attrs.dep(
            default = "toolchains//rover:output_sdl.py",
        ),
    },
    is_toolchain_rule = True,
)
