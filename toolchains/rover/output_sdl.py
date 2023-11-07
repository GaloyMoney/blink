#!/usr/bin/env python3
"""
Builds a portable, standalone npm binary.
"""
import argparse
import subprocess
import os
import sys

def main(args):
    # Check if the generator binary exists
    generator_bin = args.generator_bin
    if not os.path.isfile(generator_bin):
        print(f"Error: The generator binary '{generator_bin}' does not exist.")
        sys.exit(1)

    # Check if the generator binary is executable
    if not os.access(generator_bin, os.X_OK):
        print(f"Error: The generator binary '{generator_bin}' is not executable.")
        sys.exit(1)

    out_path = args.out_path

    # Run the generator binary and redirect stdout to the out-path
    try:
        with open(out_path, 'w') as out_file:
            command = [generator_bin] + args.additional_args
            result = subprocess.run(command, stdout=out_file, stderr=subprocess.PIPE, text=True)

        # Check if the generator command was successful
        if result.returncode != 0:
            print(f"Error: The generator binary failed to run with error:\n{result.stderr}")
            sys.exit(result.returncode)

        print(f"Success: Output written to {out_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--generator-bin",
        required=True,
        help="Path to the generator binary",
    )
    parser.add_argument(
        "--arg",
        action='append',
        dest='additional_args',
        default=[],
        help="Additional arguments to pass to the generator script prefixed with --arg"
    )
    parser.add_argument(
        "out_path",
        help="Path to output the schema to",
    )

    args = parser.parse_args()
    main(args)

