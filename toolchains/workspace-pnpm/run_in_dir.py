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
        "--bin",
        help="Binary to execute program with",
    )
    parser.add_argument(
        "args",
        help="Program and arguments",
        nargs=argparse.REMAINDER,
    )

    args = parser.parse_args()
    bin_args = args.args[1:] # ignore '--' separator
    cmd = [os.path.abspath(args.bin), *bin_args]

    exit_code = subprocess.call(cmd, cwd=args.cwd)

    sys.exit(exit_code)
