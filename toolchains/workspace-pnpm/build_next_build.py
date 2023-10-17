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
    exit_code = subprocess.call(next_cmd, cwd=args.package_dir)

    shutil.copytree(
        os.path.join(args.package_dir,".next"),
        os.path.join(args.out_path, ".next"),
        symlinks=True,
        dirs_exist_ok=True,
        )

    if os.path.exists(os.path.join(args.package_dir, "public")):
        shutil.copytree(
            os.path.join(args.package_dir,"public"),
            os.path.join(args.out_path, ".next", "standalone", "public"),
            symlinks=True,
            dirs_exist_ok=True,
            )

    if os.path.exists(os.path.join(args.package_dir, ".next", "static")):
        shutil.copytree(
            os.path.join(args.package_dir,".next", "static"),
            os.path.join(args.out_path, ".next", "standalone", "static"),
            symlinks=True,
            dirs_exist_ok=True,
            )

    sys.exit(exit_code)
