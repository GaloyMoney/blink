#!/usr/bin/env python3
"""
Executes graphql codegen
"""
import argparse
import subprocess
import os
import sys
import shutil
import re

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
            schema = os.path.relpath(schema,
                                     os.path.dirname(output_path))
            lines.insert(schema_line_index + 1, f"  - \"{schema}\"\n")
    else:
        # Append schema if not found
        lines.append("schema:\n")
        for schema in schemas:
            schema = os.path.relpath(schema,
                                     os.path.dirname(output_path))
            lines.append(f"  - \"{schema}\"\n")

    # Write to a new config file
    with open(output_path, 'w') as file:
        file.writelines(lines)

def extract_generated_paths(file_path):
    with open(file_path, 'r') as file:
        data = file.read()

    # Find 'generates:' section and extract all lines indented under it
    generates_section = re.search(r'^generates:\n((?: {2,}.+\n)+)', data, re.MULTILINE)
    if generates_section:
        # Extract paths (lines directly under 'generates:')
        paths = re.findall(r'^ {2}([^: \n]+):', generates_section.group(1), re.MULTILINE)
        return paths
    else:
        print("No 'generates:' section found or no paths under 'generates:'")
        return []

def main(args):
    # Prepare the updated config file
    updated_config_path = os.path.join(args.package_dir, "updated_config.yml")
    # out_dir = os.path.abspath(args.out_path)
    update_config_file(args.config, args.schema, updated_config_path)

    # Check if the generator binary exists
    codegen_bin = os.path.abspath(os.path.join(args.package_dir,
                                               "node_modules/.bin/graphql-codegen"))

    # Run the generator binary and pass the updated out-path directly to the command
    cmd = [
        codegen_bin,
        "--verbose",
        "--config",
        os.path.abspath(updated_config_path),
    ]

    # Print out the command for debugging purposes
    print("Running Command:")
    print(' '.join(cmd))

    result = subprocess.run(cmd, cwd=args.package_dir)

    # Check if the generator command was successful
    if result.returncode != 0:
        sys.exit(result.returncode)

    paths = extract_generated_paths(updated_config_path)
    out_dir = os.path.abspath(args.out_path)

    # Copy each file to the specified output directory
    for path in paths:
        # Calculate the absolute source path
        source_path = os.path.join(args.package_dir, path)

        # Calculate the relative path portion to preserve subdirectories
        relative_path = os.path.relpath(source_path, start=args.package_dir)
        
        # Calculate the destination path, preserving subdirectories
        destination_path = os.path.join(out_dir, relative_path)

        # Create the directory structure if it doesn't exist
        os.makedirs(os.path.dirname(destination_path), exist_ok=True)

        # Copy the file
        shutil.copy(source_path, destination_path)
        print(f"Copied: {source_path} to {destination_path}")

    sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--package-dir",
        help="Directory of the package",
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

