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
        "--deps-src",
        action="append",
        metavar="DST=SRC",
        help="Adds a dependency source into the source tree"
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

        for arg in args.deps_src or []:
            dst, src = arg.split("=")

            parent_dir = os.path.dirname(dst)
            if parent_dir:
                dst_dir = os.path.join(lib_dir, parent_dir)
                if not os.path.isdir(dst_dir):
                    os.makedirs(dst_dir, exist_ok=True)
            abspath_src = os.path.abspath(src)
            if os.path.isdir(abspath_src):
                shutil.copytree(
                    abspath_src,
                    os.path.join(lib_dir, dst),
                    symlinks=True,
                    dirs_exist_ok=True,
                )
            else:
                shutil.copy(
                    abspath_src,
                    os.path.join(lib_dir, dst),
                )

        shutil.move(lib_dir, args.out_path)
