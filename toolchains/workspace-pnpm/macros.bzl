load(
    "@prelude//:artifacts.bzl",
    "ArtifactGroupInfo",
)
load(
    "@prelude//:paths.bzl",
    "paths",
)
load(
    "@prelude//test/inject_test_run_info.bzl",
    "inject_test_run_info",
)

load("@prelude//python:toolchain.bzl", "PythonToolchainInfo",)
load(":toolchain.bzl", "WorkspacePnpmToolchainInfo",)

def npm_bin_impl(ctx: AnalysisContext) -> list[[DefaultInfo, RunInfo, TemplatePlaceholderInfo]]:
    bin_name = ctx.attrs.bin_name or ctx.attrs.name

    exe = ctx.actions.declare_output(bin_name)

    workspace_pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        workspace_pnpm_toolchain.build_npm_bin[DefaultInfo].default_outputs,
        "--bin-out-path",
        exe.as_output(),
        "--package-dir",
        ctx.label.package,
        ctx.attrs.node_modules,
        bin_name
    )

    ctx.actions.run(cmd, category = "build_npm_bin", identifier = ctx.label.package + " " + bin_name)

    return [
        DefaultInfo(default_output = exe),
        RunInfo(exe),
        TemplatePlaceholderInfo(
            keyed_variables = {
                "exe": exe,
            },
        ),
    ]

_npm_bin = rule(
    impl = npm_bin_impl,
    attrs = {
        "bin_name": attrs.option(
            attrs.string(),
            default = None,
            doc = """Node module bin name (default: attrs.name).""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds `node_modules`.""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def npm_bin(
        node_modules = ":node_modules",
        **kwargs):
    _npm_bin(
        node_modules = node_modules,
        **kwargs,
    )

def pnpm_workspace_impl(ctx: AnalysisContext) -> list[[DefaultInfo, ArtifactGroupInfo]]:
    out = ctx.actions.declare_output("pnpm-lock.yaml")

    output = ctx.actions.copy_file(out, ctx.attrs.pnpm_lock)
    ctx.actions.write_json("member-packages.json", ctx.attrs.child_packages)

    return [
        DefaultInfo(default_output = output),
        ArtifactGroupInfo(artifacts = [
            ctx.attrs.root_package,
            ctx.attrs.pnpm_lock,
            ctx.attrs.workspace_def,
        ] + ctx.attrs.child_packages),
    ]

def pnpm_workspace(**kwargs):
    pnpm_lock = "pnpm-lock.yaml"
    if not rule_exists(pnpm_lock):
        native.export_file(
            name = pnpm_lock
        )
    root_package = "package.json"
    if not rule_exists(root_package):
        native.export_file(
            name = root_package
        )
    workspace_def = "pnpm-workspace.yaml"
    if not rule_exists(workspace_def):
        native.export_file(
            name = workspace_def
        )
    _pnpm_workspace(
        pnpm_lock = ":{}".format(pnpm_lock),
        root_package = ":{}".format(root_package),
        workspace_def = ":{}".format(workspace_def),
        **kwargs,
    )

_pnpm_workspace = rule(
    impl = pnpm_workspace_impl,
    attrs = {
        "workspace_def": attrs.source(
            doc = """pnpm-workspace.yaml source.""",
        ),
        "root_package": attrs.source(
            doc = """Workspace root package.json source.""",
        ),
        "pnpm_lock": attrs.source(
            doc = """Pnpm lock file.""",
        ),
        "child_packages": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of package.json files to track.""",
        ),
    },
)

def build_node_modules_impl(ctx: AnalysisContext) -> list[DefaultInfo]:
    out = ctx.actions.declare_output("root", dir = True)

    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]
    package_dir = cmd_args(ctx.label.package).relative_to(ctx.label.cell_root)

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.build_node_modules[DefaultInfo].default_outputs,
        "--turbo-bin",
        ctx.attrs.turbo_bin[RunInfo],
    )

    cmd.add("--package-dir")
    cmd.add(package_dir)

    identifier = "install "
    if ctx.attrs.prod_only:
        cmd.add("--prod-only")
        identifier += "--prod "

    cmd.add(out.as_output())
    cmd.hidden([ctx.attrs.workspace])

    ctx.actions.run(cmd, category = "pnpm", identifier = identifier + ctx.label.package)

    return [DefaultInfo(default_output = out)]

build_node_modules = rule(
    impl = build_node_modules_impl,
    attrs = {
        "turbo_bin": attrs.dep(
            providers = [RunInfo],
            default = "//third-party/node/turbo:turbo_bin",
            doc = """Turbo dependency.""",
        ),
        "workspace": attrs.source(
            default = "//:workspace",
            doc = """Workspace root files""",
        ),
        "prod_only": attrs.bool(
            default = False,
            doc = "Only install production dependencies"
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def tsc_build_impl(ctx: AnalysisContext) -> list[DefaultInfo]:
    build_context = prepare_build_context(ctx)

    out = ctx.actions.declare_output("dist", dir = True)
    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.compile_typescript[DefaultInfo].default_outputs,
        "--package-dir",
        cmd_args([build_context.workspace_root, ctx.label.package], delimiter = "/"),
        "--tsc-bin",
        ctx.attrs.tsc[RunInfo],
        "--tsconfig",
        ctx.attrs.tsconfig,
        "--tscpaths-bin",
        ctx.attrs.tscpaths[RunInfo],
    )
    for src in ctx.attrs.additional_dist_files:
        cmd.add("--add-to-dist")
        cmd.add(src)

    cmd.add(out.as_output())

    ctx.actions.run(cmd, category = "tsc", identifier = ctx.label.package)

    return [
        DefaultInfo(default_output = out),
    ]

def tsc_build(
    node_modules = ":node_modules",
    **kwargs):
    tsc_bin = "tsc_bin"
    if not rule_exists(tsc_bin):
        npm_bin(
            name = tsc_bin,
            bin_name = "tsc",
        )
    tscpaths_bin = "tscpaths_bin"
    if not rule_exists(tscpaths_bin):
        npm_bin(
            name = tscpaths_bin,
            bin_name = "tscpaths",
        )
    _tsc_build(
        tsc = ":{}".format(tsc_bin),
        tscpaths = ":{}".format(tscpaths_bin),
        node_modules = node_modules,
        **kwargs,
    )

_tsc_build = rule(
    impl = tsc_build_impl,
    attrs = {
        "tsc": attrs.dep(
            providers = [RunInfo],
            doc = """TypeScript compiler dependency.""",
        ),
        "tsconfig": attrs.string(
            doc = """Target which builds `tsconfig.json`.""",
        ),
        "tscpaths": attrs.dep(
            providers = [RunInfo],
            doc = """tscpaths dependency.""",
        ),
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of source files to build.""",
        ),
        "additional_dist_files": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of additional files to copy to the dist output.""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds package `node_modules`.""",
        ),
        "prod_deps_srcs": attrs.dict(
            attrs.string(),
            attrs.source(allow_directory = True),
            default = {},
            doc = """Mapping of dependent prod package paths to source files to track.""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

ProdBuildInfo = provider(fields = [
  "build",
  "build_package_dir",
])

def prod_tsc_build_impl(ctx: AnalysisContext) -> list[[DefaultInfo, ProdBuildInfo]]:
    out = ctx.actions.declare_output("lib", dir = True)

    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]
    package_dir = cmd_args(ctx.label.package).relative_to(ctx.label.cell_root)

    dist_path = ctx.attrs.tsc_build[DefaultInfo].default_outputs[0]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.package_prod_tsc_build[DefaultInfo].default_outputs,
        "--package-dir",
        package_dir,
        "--node-modules-path",
        ctx.attrs.node_modules_prod[DefaultInfo].default_outputs[0],
        "--dist-path",
        dist_path,
    )

    if hasattr(ctx.attrs, 'prod_deps_srcs'):
        for (name, src) in ctx.attrs.prod_deps_srcs.items():
            cmd.add("--deps-src")
            cmd.add(cmd_args(src, format = name + "={}"))
    cmd.add(out.as_output())

    ctx.actions.run(cmd, category = "prod_tsc_build")

    return [
      DefaultInfo(default_output = out),
      ProdBuildInfo(
        build = out,
        build_package_dir = ctx.label.package,
      )]

def prod_tsc_build(
        tsc_build = ":build",
        node_modules_prod = ":node_modules_prod",
        **kwargs):
    _prod_tsc_build(
        tsc_build = tsc_build,
        node_modules_prod = node_modules_prod,
        **kwargs,
    )

_prod_tsc_build = rule(
    impl = prod_tsc_build_impl,
    attrs = {
        "tsc_build": attrs.dep(
            doc = """Target which builds the Typescript dist artifact.""",
        ),
        "node_modules_prod": attrs.dep(
            doc = """Target which builds package `node_modules` with prod-only modules.""",
        ),
        "prod_deps_srcs": attrs.dict(
            attrs.string(),
            attrs.source(allow_directory = True),
            default = {},
            doc = """Mapping of dependent prod package paths to source files to track.""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    }
)

def prod_tsc_build_bin_impl(ctx: AnalysisContext) -> list[[DefaultInfo, RunInfo]]:
    bin_name = "bin/run"
    out = ctx.actions.declare_output(bin_name)

    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]
    package_dir = cmd_args(ctx.label.package).relative_to(ctx.label.cell_root)
    prod_build = ctx.attrs.prod_tsc_build[ProdBuildInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.package_prod_tsc_build_bin[DefaultInfo].default_outputs,
        "--prod-dist-path",
        prod_build.build,
        "--package-dir",
        prod_build.build_package_dir,
    )
    if ctx.attrs.preload_file:
        cmd.add(
          "--preload-file",
          ctx.attrs.preload_file,
        )
    cmd.add(
        "--run-file",
        ctx.attrs.run_file,
        out.as_output(),
    )

    ctx.actions.run(cmd, category = "prod_tsc_build_bin", identifier = ctx.label.package + " " + bin_name)

    run_cmd = cmd_args(out)

    return [
        DefaultInfo(default_output = out),
        RunInfo(run_cmd),
    ]

_prod_tsc_build_bin = rule(
    impl = prod_tsc_build_bin_impl,
    attrs = {
        "preload_file": attrs.option(
            attrs.string(),
            default = None,
            doc = """File name and path for node preload step (default: None).""",
        ),
        "run_file": attrs.option(
            attrs.string(),
            default = None,
            doc = """File name and relative path for node executable (default: None).""",
        ),
        "bin_out_path": attrs.option(
            attrs.string(),
            default = None,
            doc = """File relative path for produced binary (default: None).""",
        ),
        "prod_tsc_build": attrs.dep(
            doc = """Target which builds `prod build`.""",
            providers = [ProdBuildInfo]
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def prod_tsc_build_bin(
        prod_tsc_build = ":prod_build",
        **kwargs):
    _prod_tsc_build_bin(
        prod_tsc_build = prod_tsc_build,
        **kwargs,
    )

def next_build_impl(ctx: AnalysisContext) -> list[[DefaultInfo, RunInfo]]:
    build_context = prepare_build_context(ctx)

    out = ctx.actions.declare_output("dist", dir = True)
    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.build_next_build[DefaultInfo].default_outputs,
        "--root-dir",
        build_context.workspace_root,
        "--package-dir",
        ctx.label.package,
    )

    for (key, val) in ctx.attrs.build_env.items():
        cmd.add(
            "--build-env",
            cmd_args([key, val], delimiter = "="),
        )
    cmd.add(out.as_output())

    ctx.actions.run(cmd, category = "next", identifier = "build " + ctx.label.package)

    run_cmd = cmd_args(ctx.attrs.next[RunInfo], "start", out)

    return [
        DefaultInfo(default_output = out),
        RunInfo(run_cmd),
    ]

def next_build(**kwargs):
    next_bin = "next_bin"
    if not rule_exists(next_bin):
        npm_bin(
            name = next_bin,
            bin_name = "next",
        )
    _next_build(
        next = ":{}".format(next_bin),
        node_modules = ":node_modules", **kwargs)

_next_build = rule(
    impl = next_build_impl,
    attrs = {
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of package source files to track.""",
        ),
        "next": attrs.dep(
            providers = [RunInfo],
            doc = """Target which builds `next build`.""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds `node_modules`.""",
        ),
        "build_env": attrs.dict(
            key = attrs.string(),
            value = attrs.arg(),
            sorted = False,
            default = {},
            doc = """Include env variables to pass to 'next build' command""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
        "prod_deps_srcs": attrs.dict(
            attrs.string(),
            attrs.source(allow_directory = True),
            default = {},
            doc = """Mapping of dependent prod package paths to source files to track.""",
        ),
    },
)

def next_build_bin_impl(ctx: AnalysisContext) -> list[[DefaultInfo, RunInfo]]:
    out = ctx.actions.declare_output("app")

    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.package_next_bin[DefaultInfo].default_outputs,
        "--next-build",
        ctx.attrs.next_build,
        "--package-dir",
        ctx.label.package,
        out.as_output(),
    )

    ctx.actions.run(cmd, category = "next_build_bin", identifier = ctx.label.package)

    run_cmd = cmd_args([out, "bin", "run"], delimiter = "/")

    return [
        DefaultInfo(default_output = out),
        RunInfo(run_cmd),
    ]

def next_build_bin(**kwargs):
    next_bin = "next_bin"
    if not rule_exists(next_bin):
        npm_bin(
            name = next_bin,
            bin_name = "next",
        )
    _next_build_bin(
        next = ":{}".format(next_bin),
        next_build = ":build",
        **kwargs,
    )

_next_build_bin = rule(
    impl = next_build_bin_impl,
    attrs = {
        "next_build": attrs.source(
            doc = """Target which builds `next build`.""",
        ),
        "next": attrs.dep(
            providers = [RunInfo],
            doc = """Target which builds `next build`.""",
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

BuildContext = record(
    workspace_root = field(Artifact),
)

def prepare_build_context(ctx: AnalysisContext) -> BuildContext:
    workspace_root = ctx.actions.declare_output("__workspace", dir = True)

    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]
    package_dir = cmd_args(ctx.label.package).relative_to(ctx.label.cell_root)

    cmd = cmd_args(
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.prepare_build_context[DefaultInfo].default_outputs,
        "--package-dir",
        package_dir,
        "--node-modules-path",
        ctx.attrs.node_modules,
    )
    for src in ctx.attrs.srcs:
        cmd.add("--src")
        cmd.add(cmd_args(src, format = ctx.label.package + "={}"))
    if hasattr(ctx.attrs, 'prod_deps_srcs'):
        for (name, src) in ctx.attrs.prod_deps_srcs.items():
            cmd.add("--src")
            cmd.add(cmd_args(src, format = name + "={}"))
    if hasattr(ctx.attrs, 'dev_deps_srcs'):
        for (name, src) in ctx.attrs.dev_deps_srcs.items():
            cmd.add("--src")
            cmd.add(cmd_args(src, format = name + "={}"))
    cmd.add(workspace_root.as_output())

    ctx.actions.run(cmd, category = "prepare_build_context", identifier = ctx.label.package)

    return BuildContext(
        workspace_root = workspace_root,
    )

def _npm_test_impl(
    ctx: AnalysisContext,
    program_run_info: RunInfo,
    program_args: cmd_args,
    test_info_type: str,
) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    build_context = prepare_build_context(ctx)

    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]

    run_cmd_args = cmd_args([
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.run_in_dir[DefaultInfo].default_outputs,
        "--cwd",
        cmd_args([build_context.workspace_root, ctx.label.package], delimiter = "/"),
        "--bin",
        cmd_args(program_run_info),
    ])

    if hasattr(ctx.attrs, 'env_file'):
        run_cmd_args.add("--env-file")
        run_cmd_args.add(ctx.attrs.env_file)

    run_cmd_args.add("--")
    run_cmd_args.add(program_args)
    args_file = ctx.actions.write("args.txt", run_cmd_args)

    return inject_test_run_info(
        ctx,
        ExternalRunnerTestInfo(
            type = test_info_type,
            command = [run_cmd_args],
            env = ctx.attrs.env,
            labels = ctx.attrs.labels,
        ),
    ) + [
        DefaultInfo(default_output = args_file),
    ]

def _audit_impl(ctx: AnalysisContext) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    pnpm_toolchain = ctx.attrs._workspace_pnpm_toolchain[WorkspacePnpmToolchainInfo]

    audit_args = cmd_args()
    audit_args.add("--ignore-registry-errors")

    run_cmd_args = cmd_args([
        ctx.attrs._python_toolchain[PythonToolchainInfo].interpreter,
        pnpm_toolchain.run_audit[DefaultInfo].default_outputs,
        "--audit-level",
        ctx.attrs.level,
        "--",
        audit_args,
    ])

    args_file = ctx.actions.write("args.txt", run_cmd_args)

    return inject_test_run_info(
        ctx,
        ExternalRunnerTestInfo(
            type = "audit",
            command = [run_cmd_args],
        ),
    ) + [
        DefaultInfo(default_output = args_file),
    ]

_audit = rule(
    impl = _audit_impl,
    attrs = {
        "level": attrs.enum(
            ["low", "moderate", "high", "critical"],
            default = "critical"
        ),
        "node_modules": attrs.source(
            doc = """Target which builds `node_modules`.""",
        ),
        "_inject_test_env": attrs.default_only(
            attrs.dep(default = "prelude//test/tools:inject_test_env"),
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def audit(
        node_modules = ":node_modules",
        visibility = ["PUBLIC"],
        **kwargs):

    _audit(
        node_modules = node_modules,
        visibility = visibility,
        **kwargs,
    )

def eslint_impl(ctx: AnalysisContext) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    args = cmd_args()
    args.add(".")
    args.add("--ext")
    args.add(",".join(ctx.attrs.extensions))
    if ctx.attrs.allow_warnings == False:
        args.add("--max-warnings=0")

    return _npm_test_impl(
        ctx,
        ctx.attrs.eslint[RunInfo],
        args,
        "eslint",
    )

_eslint = rule(
    impl = eslint_impl,
    attrs = {
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of package source files to track.""",
        ),
        "dev_deps_srcs": attrs.dict(
            attrs.string(),
            attrs.source(allow_directory = True),
            default = {},
            doc = """Mapping of dependent dev package paths to source files from to track.""",
        ),
        "eslint": attrs.dep(
            providers = [RunInfo],
            doc = """eslint dependency.""",
        ),
        "extensions": attrs.list(
            attrs.string(),
            default = [],
            doc = """File extensions to search for.""",
        ),
        "allow_warnings": attrs.bool(
            default = False,
            doc = """If `False`, then exit non-zero (treat warnings as errors).""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds `node_modules`.""",
        ),
        "env": attrs.dict(
            key = attrs.string(),
            value = attrs.arg(),
            sorted = False,
            default = {},
            doc = """Set environment variables for this rule's invocation of eslint. The environment
            variable values may include macros which are expanded.""",
        ),
        "labels": attrs.list(
            attrs.string(),
            default = [],
        ),
        "_inject_test_env": attrs.default_only(
            attrs.dep(default = "prelude//test/tools:inject_test_env"),
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def eslint(
        eslint_bin = "eslint",
        node_modules = ":node_modules",
        visibility = ["PUBLIC"],
        **kwargs):
    if not rule_exists(eslint_bin):
        npm_bin(
            name = eslint_bin,
            bin_name="eslint"
        )

    _eslint(
        eslint = ":{}".format(eslint_bin),
        node_modules = node_modules,
        visibility = visibility,
        **kwargs,
    )

def typescript_check_impl(ctx: AnalysisContext) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    args = cmd_args()
    args.add("--noEmit")
    args.add(ctx.attrs.args)

    return _npm_test_impl(
        ctx,
        ctx.attrs.tsc[RunInfo],
        args,
        "tsc",
    )

_typescript_check = rule(
    impl = typescript_check_impl,
    attrs = {
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of package source files to track.""",
        ),
        "tsc": attrs.dep(
            providers = [RunInfo],
            doc = """tsc dependency.""",
        ),
        "args": attrs.list(
            attrs.string(),
            default = [],
            doc = """Extra arguments passed to tsc.""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds package `node_modules`.""",
        ),
        "env": attrs.dict(
            key = attrs.string(),
            value = attrs.arg(),
            sorted = False,
            default = {},
            doc = """Set environment variables for this rule's invocation of tsc. The environment
            variable values may include macros which are expanded.""",
        ),
        "labels": attrs.list(
            attrs.string(),
            default = [],
        ),
        "_inject_test_env": attrs.default_only(
            attrs.dep(default = "prelude//test/tools:inject_test_env"),
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def typescript_check(
        node_modules = ":node_modules",
        visibility = ["PUBLIC"],
        **kwargs):
    tsc_bin = "tsc_bin"
    if not rule_exists(tsc_bin):
        npm_bin(
            name = tsc_bin,
            bin_name = "tsc",
        )

    _typescript_check(
        tsc = ":{}".format(tsc_bin),
        node_modules = node_modules,
        visibility = visibility,
        **kwargs,
    )

def yaml_check_impl(ctx: AnalysisContext) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    args = cmd_args()
    args.add("--check")
    args.add("**/*.(yaml|yml)")

    return _npm_test_impl(
        ctx,
        ctx.attrs.prettier[RunInfo],
        args,
        "prettier",
    )

_yaml_check = rule(
    impl = yaml_check_impl,
    attrs = {
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of package source files to track.""",
        ),
        "prettier": attrs.dep(
            providers = [RunInfo],
            doc = """prettier dependency.""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds package `node_modules`.""",
        ),
        "env": attrs.dict(
            key = attrs.string(),
            value = attrs.arg(),
            sorted = False,
            default = {},
            doc = """Set environment variables for this rule's invocation of prettier. The environment
            variable values may include macros which are expanded.""",
        ),
        "labels": attrs.list(
            attrs.string(),
            default = [],
        ),
        "_inject_test_env": attrs.default_only(
            attrs.dep(default = "prelude//test/tools:inject_test_env"),
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def yaml_check(
        node_modules = ":node_modules",
        visibility = ["PUBLIC"],
        **kwargs):
    prettier_bin = "prettier_bin"
    if not rule_exists(prettier_bin):
        npm_bin(
            name = prettier_bin,
            bin_name = "prettier",
        )

    _yaml_check(
        prettier = ":{}".format(prettier_bin),
        node_modules = node_modules,
        visibility = visibility,
        **kwargs,
    )

def madge_check_impl(ctx: AnalysisContext) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    args = cmd_args()
    args.add("--circular")
    args.add("--extensions")
    args.add("ts")
    args.add("src")

    return _npm_test_impl(
        ctx,
        ctx.attrs.madge[RunInfo],
        args,
        "madge",
    )

_madge_check = rule(
    impl = madge_check_impl,
    attrs = {
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of package source files to track.""",
        ),
        "madge": attrs.dep(
            providers = [RunInfo],
            doc = """madge dependency.""",
        ),
        "node_modules": attrs.source(
            doc = """Target which builds package `node_modules`.""",
        ),
        "env": attrs.dict(
            key = attrs.string(),
            value = attrs.arg(),
            sorted = False,
            default = {},
            doc = """Set environment variables for this rule's invocation of madge. The environment
            variable values may include macros which are expanded.""",
        ),
        "labels": attrs.list(
            attrs.string(),
            default = [],
        ),
        "_inject_test_env": attrs.default_only(
            attrs.dep(default = "prelude//test/tools:inject_test_env"),
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def madge_check(
        node_modules = ":node_modules",
        visibility = ["PUBLIC"],
        **kwargs):
    madge_bin = "madge_bin"
    if not rule_exists(madge_bin):
        npm_bin(
            name = madge_bin,
            bin_name = "madge",
        )

    _madge_check(
        madge = ":{}".format(madge_bin),
        node_modules = node_modules,
        visibility = visibility,
        **kwargs,
    )

def pnpm_task_binary_impl(ctx: AnalysisContext) -> list[[DefaultInfo, RunInfo]]:
    script = ctx.actions.write("pnpm-run.sh", """\
#!/usr/bin/env bash
set -euo pipefail

rootpath="$(git rev-parse --show-toplevel)"
install_node_modules="$1"
npm_package_path="$2"
env_file="$3"
npm_run_command="$4"

cd "$rootpath/$npm_package_path"
if [ "$install_node_modules" = "True" ]; then
    pnpm install --frozen-lockfile
fi

if [[ -f "$env_file" ]]; then
    source "$env_file"
fi

if [ "${*:5}" ]; then
    exec pnpm run --report-summary "$npm_run_command" -- "${@:5}"
else
    exec pnpm run --report-summary "$npm_run_command"
fi
""", is_executable = True)

    env_file = ctx.attrs.env_file if ctx.attrs.env_file else ""
    args = cmd_args([
        script,
        str(ctx.attrs.local_node_modules),
        ctx.label.package,
        env_file,
        ctx.attrs.command
    ])
    args.hidden([ctx.attrs.deps])
    args.hidden([ctx.attrs.srcs])

    return [DefaultInfo(), RunInfo(args = args)]

dev_pnpm_task_binary = rule(impl = pnpm_task_binary_impl, attrs = {
    "command": attrs.string(doc = """pnpm command to run"""),
    "local_node_modules": attrs.bool(default = True, doc = """Need to run pnpm install first?"""),
    "srcs": attrs.list(attrs.source(), default = [], doc = """List of sources we require"""),
    "deps": attrs.list(attrs.source(), default = [], doc = """List of dependencies we require"""),
    "env_file": attrs.option(
        attrs.string(),
        doc = """File name and relative path for env variables required.""",
        default = None,
    ),
})

def pnpm_task_test_impl(ctx: AnalysisContext) -> list[[DefaultInfo, ExternalRunnerTestInfo]]:
    script = ctx.actions.write("pnpm-run.sh", """\
#!/usr/bin/env bash
set -euo pipefail

rootpath="$(git rev-parse --show-toplevel)"
install_node_modules="$1"
npm_package_path="$2"
npm_run_command="$3"

cd "$rootpath/$npm_package_path"
if [ "$install_node_modules" = "True" ]; then
    pnpm install --frozen-lockfile
fi
exec pnpm run --report-summary "$npm_run_command"
""", is_executable = True)
    args = cmd_args([script, str(ctx.attrs.local_node_modules), ctx.label.package, ctx.attrs.command])
    args.hidden([ctx.attrs.deps])
    args.hidden([ctx.attrs.srcs])
    return [DefaultInfo(), ExternalRunnerTestInfo(type = "integration", command = [script, str(ctx.attrs.local_node_modules), ctx.label.package, ctx.attrs.command])]

dev_pnpm_task_test = rule(impl = pnpm_task_test_impl, attrs = {
    "command": attrs.string(default = "start", doc = """pnpm command to run"""),
    "local_node_modules": attrs.bool(default = True, doc = """Need to run pnpm install first?"""),
    "srcs": attrs.list(attrs.source(), default = [], doc = """List of sources we require"""),
    "deps": attrs.list(attrs.source(), default = [], doc = """List of dependencies we require"""),
})

def jest_test_impl(ctx: AnalysisContext) -> list[[
    DefaultInfo,
    RunInfo,
    ExternalRunnerTestInfo,
]]:
    args = cmd_args()
    args.add("--config")
    args.add(ctx.attrs.config_file)
    args.add("--bail")
    args.add("--verbose")
    if ctx.attrs.run_serially:
        args.add("--runInBand")

    return _npm_test_impl(
        ctx,
        ctx.attrs.jest[RunInfo],
        args,
        "jest",
    )

_jest_test = rule(
    impl = jest_test_impl,
    attrs = {
        "srcs": attrs.list(
            attrs.source(),
            default = [],
            doc = """List of package source files to track.""",
        ),
        "jest": attrs.dep(
            providers = [RunInfo],
            doc = """jest dependency.""",
        ),
        "config_file": attrs.option(
            attrs.string(),
            doc = """File name and relative path for jest config.""",
        ),
        "run_serially": attrs.bool(
            default = False,
            doc = "Run all tests serially in the current process"
        ),
        "env_file": attrs.option(
            attrs.string(),
            doc = """File name and relative path for env variables required.""",
        ),
        "env": attrs.dict(
            key = attrs.string(),
            value = attrs.arg(),
            sorted = False,
            default = {},
            doc = """Set environment variables for this rule's invocation of jest. The environment
            variable values may include macros which are expanded.""",
        ),
        "labels": attrs.list(
            attrs.string(),
            default = [],
        ),
        "node_modules": attrs.source(
            doc = """Target which builds package `node_modules`.""",
        ),
        "prod_deps_srcs": attrs.dict(
            attrs.string(),
            attrs.source(allow_directory = True),
            default = {},
            doc = """Mapping of dependent prod package paths to source files to track.""",
        ),
        "_inject_test_env": attrs.default_only(
            attrs.dep(default = "prelude//test/tools:inject_test_env"),
        ),
        "_python_toolchain": attrs.toolchain_dep(
            default = "toolchains//:python",
            providers = [PythonToolchainInfo],
        ),
        "_workspace_pnpm_toolchain": attrs.toolchain_dep(
            default = "toolchains//:workspace_pnpm",
            providers = [WorkspacePnpmToolchainInfo],
        ),
    },
)

def jest_test(
        node_modules = ":node_modules",
        visibility = ["PUBLIC"],
        **kwargs):
    jest_bin = "jest_bin"
    if not rule_exists(jest_bin):
        npm_bin(
            name = jest_bin,
            bin_name = "jest",
        )

    _jest_test(
        jest = ":{}".format(jest_bin),
        node_modules = node_modules,
        visibility = visibility,
        **kwargs,
    )
