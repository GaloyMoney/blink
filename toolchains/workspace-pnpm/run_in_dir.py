#!/usr/bin/env python3
"""
Runs a program in a directory.
"""
import argparse
import json
import os
import subprocess
import sys

def merge_env_from_file(file_path):
    # Shell command to source the .env file and then get the environment as JSON using jq
    if file_path and os.path.exists(file_path):
        cmd = f'source {file_path} && jq -n env'
    else:
        cmd = f'jq -n env'

    result = subprocess.run(cmd, capture_output=True, text=True, shell=True, executable="/bin/bash")
    if result.returncode != 0:
        raise RuntimeError(result.stderr)

    return json.loads(result.stdout)

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
        "args",
        help="Program and arguments",
        nargs=argparse.REMAINDER,
    )

    args = parser.parse_args()
    bin_args = args.args[1:] # ignore '--' separator
    cmd = [os.path.abspath(args.bin), *bin_args]

    env = merge_env_from_file(args.env_file)
    exit_code = subprocess.call(cmd, cwd=args.cwd, env=env)

    sys.exit(exit_code)
