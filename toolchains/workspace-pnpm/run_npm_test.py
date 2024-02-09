#!/usr/bin/env python3
"""
Runs a program in a directory.
"""
import argparse
import os
import subprocess
import sys

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
        "--env-file",
        help="Env file to load variables from",
    )
    parser.add_argument(
        "--app-env",
        action="append",
        default=[],
        help="Add an app env variable"
    )
    parser.add_argument(
        "args",
        help="Program and arguments",
        nargs=argparse.REMAINDER,
    )

    args = parser.parse_args()

    env = os.environ.copy()
    for env_pair in args.app_env:
        key, val = env_pair.split('=', 1)
        env[key] = val

    bin_args = args.args[1:] # ignore '--' separator
    if env.get("TEST"):
        bin_args.append(env.get("TEST"))
    cmd = [os.path.abspath(args.bin), *bin_args]

    exit_code = subprocess.call(cmd, cwd=args.cwd, env=env)

    sys.exit(exit_code)
