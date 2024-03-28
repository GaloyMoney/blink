#!/usr/bin/env python3
"""
Executes graphql codegen
"""
import argparse
import subprocess
import os
import sys

def update_config_file(original_config_path, schemas, output_path):
    with open(original_config_path, 'r') as file:
        lines = file.readlines()
    
    # Find the line containing the 'schema:' key
    schema_line_index = next((i for i, line in enumerate(lines) if line.strip().startswith('schema:')), None)
    
    if schema_line_index is not None:
        # Remove existing schema lines
        while schema_line_index + 1 < len(lines) and lines[schema_line_index + 1].strip().startswith('-'):
            lines.pop(schema_line_index + 1)
        
        # Insert new schemas
        for schema in reversed(schemas):
            lines.insert(schema_line_index + 1, f"  - \"{schema}\"\n")
    else:
        # Append schema if not found
        lines.append("schema:\n")
        for schema in schemas:
            lines.append(f"  - \"{schema}\"\n")
    
    # Write to a new config file
    with open(output_path, 'w') as file:
        file.writelines(lines)

def main(args):
    # Prepare the updated config file
    updated_config_path = "updated_config.yml"
    update_config_file(args.config, args.schema, updated_config_path)

    # Check if the generator binary exists
    codegen_bin = args.graphql_codegen_bin

    # Run the generator binary and pass the updated out-path directly to the command
    cmd = [
        codegen_bin,
        "--verbose",
        "--config",
        updated_config_path,
    ]

    # Print out the command for debugging purposes
    print("Running Command:")
    print(' '.join(cmd))

    try:
        # Run the command without redirecting stdout since output is handled by rover itself
        result = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)

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
        "--graphql-codegen-bin",
        required=True,
        help="Path to rover bin",
    )
    parser.add_argument(
        "--config",
        required=True,
        help="Path to codegen.yml",
    )
    parser.add_argument(
        "--schema",
        action="append",
        default=[],
        help="Schema for codegen",
    )
    parser.add_argument(
        "out_path",
        help="Path to output the code to",
    )

    args = parser.parse_args()
    main(args)

