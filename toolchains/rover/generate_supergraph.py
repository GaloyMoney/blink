#!/usr/bin/env python3
"""
Creates a supergraph
"""
import argparse
import subprocess
import os
import sys
import json

def main(args):
    # Check if the generator binary exists
    rover_bin = args.rover_bin

    # Prepare the environment variables from the subgraph argument
    env = os.environ.copy()
    for subgraph in args.subgraph:
        key, path = subgraph.split('=')
        absolute_path = os.path.abspath(path)
        env[key] = absolute_path

    # Run the generator binary and pass the out-path directly to the command
    cmd = [
        rover_bin,
        "supergraph",
        "compose",
        "--config",
        args.config,
        "--output",
        args.out_path,  # The output path is passed directly to rover command
        "--elv2-license",
        "accept"
    ]

    # Print out the command for debugging purposes
    print("Running Command:")
    print(' '.join(cmd))

    try:
        # Run the command without redirecting stdout since output is handled by rover itself
        result = subprocess.run(cmd, stderr=subprocess.PIPE, text=True, env=env)

        # Check if the generator command was successful
        if result.returncode != 0:
            print(f"Error: The generator binary failed to run with error:\n{result.stderr}")
            sys.exit(result.returncode)

        print(f"Success: Output written to {args.out_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--rover-bin",
        required=True,
        help="Path to rover bin",
    )
    parser.add_argument(
        "--config",
        required=True,
        help="Path to supergraph-config",
    )
    parser.add_argument(
        "--subgraph",
        action="append",
        default=[],
        help="Subgraph environment variables in the format ENV=path",
    )
    parser.add_argument(
        "out_path",
        help="Path to output the schema to",
    )

    args = parser.parse_args()
    main(args)

