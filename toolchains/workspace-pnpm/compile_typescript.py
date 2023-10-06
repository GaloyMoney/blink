#!/usr/bin/env python3
"""
Runs a tsc compilation.
"""
import argparse
import subprocess
import sys
import os

def compute_path(arg: str, cwd: str) -> str:
    return os.path.relpath(
        os.path.abspath(arg),
        cwd,
        )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--package-dir",
        help="Directory of the package",
        )
    parser.add_argument(
        "--tsc-bin",
        help="Path to the tsc executable",
        )
    parser.add_argument(
        "--tsconfig",
        help="Path to tsconfig",
        )
    parser.add_argument(
        "--tscpaths-bin",
        help="Path to the tscpaths executable",
        )
    parser.add_argument(
        "out_path",
        help="Path to output directory",
        )

    args = parser.parse_args()

    tsc_cmd = [
        os.path.abspath(args.tsc_bin),
        "-p",
        os.path.relpath(args.tsconfig),
        "--outDir",
        os.path.abspath(args.out_path),
        ]

    exit_code = subprocess.call(tsc_cmd, cwd=args.package_dir)
    if exit_code != 0:
        sys.exit(exit_code)

    tscpaths_cmd = [
        os.path.abspath(args.tscpaths_bin),
        "-p",
        os.path.relpath(args.tsconfig),
        "-s",
        os.path.relpath("src"),
        "-o",
        os.path.abspath(args.out_path),
    ]
    exit_code = subprocess.call(tscpaths_cmd, cwd=args.package_dir)

    sys.exit(exit_code)
