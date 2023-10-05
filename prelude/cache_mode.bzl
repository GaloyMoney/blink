# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under both the MIT license found in the
# LICENSE-MIT file in the root directory of this source tree and the Apache
# License, Version 2.0 found in the LICENSE-APACHE file in the root directory
# of this source tree.

CacheModeInfo = provider(fields = {"allow_cache_uploads": provider_field(typing.Any, default = None), "cache_bust_genrules": provider_field(typing.Any, default = None)})
