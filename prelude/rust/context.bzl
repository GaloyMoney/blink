# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under both the MIT license found in the
# LICENSE-MIT file in the root directory of this source tree and the Apache
# License, Version 2.0 found in the LICENSE-APACHE file in the root directory
# of this source tree.

load("@prelude//cxx:cxx_toolchain_types.bzl", "CxxToolchainInfo")
load("@prelude//linking:link_info.bzl", "LinkStyle")
load(":build_params.bzl", "CrateType", "Emit")
load(":link_info.bzl", "CrateName")
load(":rust_toolchain.bzl", "RustToolchainInfo")

# Struct for sharing common args between rustc and rustdoc
# (rustdoc just relays bunch of the same args to rustc when trying to gen docs)
CommonArgsInfo = record(
    args = field(cmd_args),
    subdir = field(str),
    tempfile = field(str),
    short_cmd = field(str),
    is_check = field(bool),
    crate_map = field(list[(CrateName, Label)]),
)

ExternArg = record(
    flags = str,
    lib = field(Artifact),
)

CrateMapArg = record(
    label = field(Label),
)

# Compile info which is reusable between multiple compilation command performed
# by the same rule.
CompileContext = record(
    toolchain_info = field(RustToolchainInfo),
    cxx_toolchain_info = field(CxxToolchainInfo),
    # Symlink root containing all sources.
    symlinked_srcs = field(Artifact),
    # Linker args to pass the linker wrapper to rustc.
    linker_args = field(cmd_args),
    # Clippy wrapper (wrapping clippy-driver so it has the same CLI as rustc).
    clippy_wrapper = field(cmd_args),
    # Memoized common args for reuse.
    common_args = field(dict[(CrateType, Emit, LinkStyle), CommonArgsInfo]),
    flagfiles_for_extern = field(dict[ExternArg, Artifact]),
    flagfiles_for_crate_map = field(dict[CrateMapArg, Artifact]),
    transitive_dependency_dirs = field(dict[Artifact, None]),
)
