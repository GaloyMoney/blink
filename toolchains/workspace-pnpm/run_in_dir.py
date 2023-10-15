#!/usr/bin/env python3
"""
Runs a program in a directory.
"""
import argparse
import os
import subprocess
import sys

from typing import Optional

def compute_path(arg: str, dist_path: Optional[str]) -> str:
    if dist_path and arg.endswith("::absdistpath"):
        return os.path.abspath(
            os.path.join(dist_path, arg).removesuffix("::absdistpath")
        )
    else:
        return arg


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--cwd",
        help="Directory under which to run the program",
    )
    parser.add_argument(
        "--package-dir",
        help="Path to the workspace member package",
    )
    parser.add_argument(
        "--bin",
        help="Binary to execute program with",
    )
    parser.add_argument(
        "args",
        help="Program and arguments",
        nargs=argparse.REMAINDER,
    )

    args = parser.parse_args()

    cwd = args.cwd

    dist_path = None
    if args.package_dir:
        dist_path = os.path.join(
            os.path.abspath(cwd),
            args.package_dir,
            "dist",
        )

    args.args.pop(0)
    bin_args = []
    for arg in args.args:
        bin_args.append(compute_path(arg, dist_path))

    cmd = [os.path.abspath(args.bin), *bin_args]
    exit_code = subprocess.call(cmd, cwd=cwd)

    sys.exit(exit_code)
