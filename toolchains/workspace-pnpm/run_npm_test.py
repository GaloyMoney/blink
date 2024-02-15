#!/usr/bin/env python3
"""
Runs a program in a directory.
"""
import argparse
import json
import os
import subprocess
import sys

def env_dict_from_target(target):
    repo_root_cmd = ["git", "rev-parse", "--show-toplevel"]
    repo_root_res = subprocess.run(repo_root_cmd, capture_output=True, text=True)
    if repo_root_res.returncode != 0:
        raise RuntimeError(repo_root_res.stderr)
    repo_root = repo_root_res.stdout.strip()

    env_json_cmd = [
        "buck2",
        "--isolation-dir",
        "buck-out",
        "uquery",
        "inputs(deps('{}'))".format(target),
    ]
    env_json_res = subprocess.run(env_json_cmd, capture_output=True, text=True)
    if env_json_res.returncode != 0:
        raise RuntimeError(env_json_res.stderr)
    env_json = env_json_res.stdout.strip()


    abs_file_path = "{}/{}".format(repo_root, env_json)
    with open(abs_file_path, 'r') as file:
        env_dict = json.load(file)

    return env_dict


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
        "--env-json-target",
        help="Env file to load variables from",
    )
    parser.add_argument(
        "args",
        help="Program and arguments",
        nargs=argparse.REMAINDER,
    )

    args = parser.parse_args()

    env = os.environ.copy()
    if (args.env_json_target):
        env_json = env_dict_from_target(args.env_json_target)
        env = {**env, **env_json}

    bin_args = args.args[1:] # ignore '--' separator
    if env.get("TEST"):
        bin_args.append(env.get("TEST"))
    cmd = [os.path.abspath(args.bin), *bin_args]

    exit_code = subprocess.call(cmd, cwd=args.cwd, env=env)

    sys.exit(exit_code)
