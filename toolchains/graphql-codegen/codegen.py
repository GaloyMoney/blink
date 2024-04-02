#!/usr/bin/env python3
"""
Executes graphql codegen
"""
import argparse
import subprocess
import os
import sys
import shutil
import tempfile

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
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Write to a new config file
    with open(output_path, 'w') as file:
        file.writelines(lines)
    with open(output_path, 'r') as file:
        for line in file:
            print(line, end='')

def main(args):
    with tempfile.TemporaryDirectory() as tempdir:
        root_dir = os.path.join(tempdir, "root")
        # Prepare the updated config file
        updated_config_path = os.path.join(root_dir, "updated_config.yml")
        update_config_file(args.config, args.schema, updated_config_path)

        for arg in args.src or []:
            dst, src = arg.split("=")

            parent_dir = os.path.dirname(dst)
            if parent_dir:
                dst_dir = os.path.join(root_dir, parent_dir)
                if not os.path.isdir(dst_dir):
                    os.makedirs(dst_dir, exist_ok=True)
            abspath_src = os.path.abspath(src)
            if os.path.isdir(abspath_src):
                shutil.copytree(
                    abspath_src,
                    os.path.join(root_dir, dst),
                    symlinks=True,
                    dirs_exist_ok=True,
                )
            else:
                shutil.copy(
                    abspath_src,
                    os.path.join(root_dir, dst),
                )

        # Use os.listdir() to get everything in the directory
        contents = os.listdir(root_dir)
        
        # Print the contents
        for item in contents:
            print(item)

        # Check if the generator binary exists
        codegen_bin = args.graphql_codegen_bin

        # Run the generator binary and pass the updated out-path directly to the command
        cmd = [
            codegen_bin,
            "--verbose",
            "--config",
            updated_config_path
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

        os.makedirs(os.path.dirname(args.out_path), exist_ok=True)
        shutil.move(os.path.join(root_dir), os.path.join(args.out_path))


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
        "--src",
        action="append",
        help="Add a source into the source tree"
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

