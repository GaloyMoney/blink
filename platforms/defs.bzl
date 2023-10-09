def _platforms(ctx):
    configuration = ConfigurationInfo(
        constraints = {},
        values = {},
    )

    # This is the default image used in BuildBuddy SaaS executor.
    # This one is Ubuntu 22.04 (i.e. its current LTS release): https://hub.docker.com/_/ubuntu
    image = "docker://bodymindarts/rbe-nix:latest"
    platform = ExecutionPlatformInfo(
        label = ctx.label.raw_target(),
        configuration = configuration,
        executor_config = CommandExecutorConfig(
            local_enabled = True,
            remote_enabled = True,
            use_limited_hybrid = True,
            remote_execution_properties = {
                "OSFamily": "Linux",
                "container-image": image,
            },
            remote_execution_use_case = "buck2-default",
            remote_output_paths = "output_paths",
        ),
    )

    return [DefaultInfo(), ExecutionPlatformRegistrationInfo(platforms = [platform])]

platforms = rule(attrs = {}, impl = _platforms)
