#!/usr/bin/env python3
"""
Runs a tsc compilation.
"""
import argparse
import subprocess
import sys
import os
import shutil

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root-dir",
        help="Path to the root",
    )
    parser.add_argument(
        "--package-dir",
        help="Directory of the package",
        )
    parser.add_argument(
        "out_path",
        help="Path to output directory",
        )

    args = parser.parse_args()

    next_cmd = [
        os.path.relpath("node_modules/.bin/next"),
        "build"
        ]

    app_dir = os.path.join(args.root_dir, args.package_dir)
    build_out_dir = os.path.join(app_dir, ".next")

    exit_code = subprocess.call(next_cmd, cwd=app_dir)

    shutil.copytree(
        build_out_dir,
        os.path.join(args.out_path, ".next"),
        symlinks=True,
        dirs_exist_ok=True,
        )

    if os.path.exists(os.path.join(app_dir, "public")):
        shutil.copytree(
            os.path.join(app_dir, "public"),
            os.path.join(args.out_path, ".next", "standalone", args.package_dir, "public"),
            symlinks=True,
            dirs_exist_ok=True,
            )

    if os.path.exists(os.path.join(build_out_dir, "static")):
        shutil.copytree(
            os.path.join(build_out_dir, "static"),
            os.path.join(args.out_path, ".next", "standalone",
                         args.package_dir,".next", "static"),
            symlinks=True,
            dirs_exist_ok=True,
            )

    sys.exit(exit_code)
