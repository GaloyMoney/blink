# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under both the MIT license found in the
# LICENSE-MIT file in the root directory of this source tree and the Apache
# License, Version 2.0 found in the LICENSE-APACHE file in the root directory
# of this source tree.

def _maybe_get_bool(config: str, default: [None, bool]) -> [None, bool]:
    result = read_root_config("apple", config, None)
    if result == None:
        return default
    return result.lower() == "true"

def _get_bundling_path_conflicts_check_enabled():
    check_enabled = _maybe_get_bool("bundling_path_conflicts_check_enabled", None)
    if check_enabled != None:
        return check_enabled

    return select({
        "DEFAULT": True,
        "ovr_config//features/apple/constraints:bundling_path_conflicts_check_disabled": False,
        "ovr_config//features/apple/constraints:bundling_path_conflicts_check_enabled": True,
    })

def apple_bundle_config() -> dict[str, typing.Any]:
    return {
        "_bundling_cache_buster": read_root_config("apple", "bundling_cache_buster", None),
        "_bundling_log_file_enabled": _maybe_get_bool("bundling_log_file_enabled", True),
        "_bundling_log_file_level": read_root_config("apple", "bundling_log_file_level", None),
        "_bundling_path_conflicts_check_enabled": _get_bundling_path_conflicts_check_enabled(),
        "_codesign_type": read_root_config("apple", "codesign_type_override", None),
        "_compile_resources_locally_override": _maybe_get_bool("compile_resources_locally_override", None),
        "_dry_run_code_signing": _maybe_get_bool("dry_run_code_signing", False),
        # This is a kill switch for the feature, it can also be disabled by setting
        # `apple.fast_adhoc_signing_enabled=false` in a global buckconfig file.
        "_fast_adhoc_signing_enabled": _maybe_get_bool("fast_adhoc_signing_enabled", True),
        "_incremental_bundling_enabled": _maybe_get_bool("incremental_bundling_enabled", True),
        "_info_plist_identify_build_system_default": _maybe_get_bool("info_plist_identify_build_system", True),
        "_profile_bundling_enabled": _maybe_get_bool("profile_bundling_enabled", False),
        "_use_entitlements_when_adhoc_code_signing": _maybe_get_bool("use_entitlements_when_adhoc_code_signing", None),
    }
