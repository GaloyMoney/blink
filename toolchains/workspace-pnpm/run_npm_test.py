#!/usr/bin/env python3
"""
Runs a program in a directory.
"""
import argparse
import json
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
        "--env-json",
        help="Env file to load variables from",
    )
    parser.add_argument(
        "args",
        help="Program and arguments",
        nargs=argparse.REMAINDER,
    )

    args = parser.parse_args()

    env = os.environ.copy()
    if (args.env_json):
        with open(args.env_json, 'r') as file:
            env_dict = json.load(file)
        env = {**env, **env_dict}

    bin_args = args.args[1:] # ignore '--' separator
    if env.get("TEST"):
        bin_args.append(env.get("TEST"))
    cmd = [os.path.abspath(args.bin), *bin_args]

    exit_code = subprocess.call(cmd, cwd=args.cwd, env=env)

    sys.exit(exit_code)
