# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under both the MIT license found in the
# LICENSE-MIT file in the root directory of this source tree and the Apache
# License, Version 2.0 found in the LICENSE-APACHE file in the root directory
# of this source tree.

load("@prelude//:artifacts.bzl", "ArtifactGroupInfo")
load("@prelude//go:toolchain.bzl", "GoToolchainInfo")
load("@prelude//utils:utils.bzl", "value_or")

GoPkg = record(
    # Built w/ `-shared`.
    shared = field(Artifact),
    # Built w/o `-shared`.
    static = field(Artifact),
)

def go_attr_pkg_name(ctx: AnalysisContext) -> str:
    """
    Return the Go package name for the given context corresponding to a rule.
    """
    return value_or(ctx.attrs.package_name, ctx.label.package)

def merge_pkgs(pkgss: list[dict[str, typing.Any]]) -> dict[str, typing.Any]:
    """
    Merge mappings of packages into a single mapping, throwing an error on
    conflicts.
    """

    all_pkgs = {}

    for pkgs in pkgss:
        for name, path in pkgs.items():
            if name in pkgs and pkgs[name] != path:
                fail("conflict for package {!r}: {} and {}".format(name, path, all_pkgs[name]))
            all_pkgs[name] = path

    return all_pkgs

def pkg_artifacts(pkgs: dict[str, GoPkg], shared: bool = False) -> dict[str, Artifact]:
    """
    Return a map package name to a `shared` or `static` package artifact.
    """
    return {
        name: pkg.shared if shared else pkg.static
        for name, pkg in pkgs.items()
    }

def stdlib_pkg_artifacts(toolchain: GoToolchainInfo, shared: bool = False) -> dict[str, Artifact]:
    """
    Return a map package name to a `shared` or `static` package artifact of stdlib.
    """

    prebuilt_stdlib = toolchain.prebuilt_stdlib_shared if shared else toolchain.prebuilt_stdlib
    stdlib_pkgs = prebuilt_stdlib[ArtifactGroupInfo].artifacts

    if len(stdlib_pkgs) == 0:
        fail("Stdlib for current platfrom is missing from toolchain.")

    pkgs = {}
    for pkg in stdlib_pkgs:
        _, _, pkg_relpath = pkg.short_path.removeprefix("prebuilt_std/").partition("/")  # like net/http.a
        name = pkg_relpath.removesuffix(".a")  # like net/http
        pkgs[name] = pkg

    return pkgs
