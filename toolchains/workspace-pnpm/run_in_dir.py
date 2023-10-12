#!/usr/bin/env python3
"""
Runs a program in a directory.
"""
import argparse
import os
import subprocess
import sys

def compute_path(arg: str) -> str:
    if arg.endswith("::abspath"):
        return os.path.abspath(arg.removesuffix("::abspath"))
    else:
        return arg


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--cwd",
        help="Directory under which to run the program",
    )
    parser.add_argument(
        "args",
        help="Program and arguments",
        nargs=argparse.REMAINDER,
    )

    args = parser.parse_args()
    args.args.pop(0) # pops the '--' separator off

    cwd = args.cwd

    cmd = []
    for arg in args.args:
        cmd.append(compute_path(arg))

    exit_code = subprocess.call(cmd, cwd=cwd)

    sys.exit(exit_code)



