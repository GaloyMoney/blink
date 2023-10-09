#!/usr/bin/env python3
"""
Builds an isolated dist tree containing a pruned sub-package and all
production node_modules.
"""
import argparse
import os
import shutil
import stat
import tempfile

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--package-dir",
        help="Path to the workspace member package",
    )
    parser.add_argument(
        "--node-modules-path",
        help="Path to package `node_modules`",
    )
    parser.add_argument(
        "--dist-path",
        help="Path to `dist` scripts",
    )
    parser.add_argument(
        "out_path",
        help="Path to output directory",
    )

    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as tempdir:
        lib_dir = os.path.join(tempdir, "lib")
        package_dir = os.path.join(lib_dir, args.package_dir)

        # Copy node_modules prunned tree into tempdir
        shutil.copytree(
            args.node_modules_path,
            lib_dir,
            symlinks=True,
        )
        # Copy dist into the sub-package's dir
        shutil.copytree(
            args.dist_path,
            os.path.join(
                package_dir,
                os.path.basename(args.dist_path),
            ),
            symlinks=True,
        )

        shutil.move(lib_dir, args.out_path)
