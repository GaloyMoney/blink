#!/usr/bin/env python3
"""
Runs a tsc compilation.
"""
import argparse
import subprocess
import sys
import os
import shutil

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
        "--add-to-dist",
        action="append",
        help="Add a source into the source tree"
    )
    parser.add_argument(
        "out_path",
        help="Path to output directory",
        )

    args = parser.parse_args()

    out_dir = os.path.abspath(args.out_path)

    tsc_cmd = [
        os.path.abspath(args.tsc_bin),
        "-p",
        os.path.relpath(args.tsconfig),
        "--outDir",
        out_dir
        ]

    exit_code = subprocess.call(tsc_cmd, cwd=args.package_dir)

    for parent_dir in args.add_to_dist or []:
      src_dir = os.path.join(parent_dir, 'src')
      if not os.path.exists(src_dir):
          print(f"Warning: 'src' directory not found in {parent_dir}")
          continue

      for item in os.listdir(src_dir):
          src_item_path = os.path.join(src_dir, item)
          dst_item_path = os.path.join(out_dir, item)

          if os.path.isdir(src_item_path):
              shutil.copytree(src_item_path, dst_item_path, symlinks=True, dirs_exist_ok=True)
          else:
              shutil.copy(src_item_path, dst_item_path)



    if exit_code != 0:
        sys.exit(exit_code)

    tscpaths_cmd = [
        os.path.abspath(args.tscpaths_bin),
        "-p",
        os.path.relpath(args.tsconfig),
        "-s",
        os.path.relpath("src"),
        "-o",
        out_dir
    ]
    exit_code = subprocess.call(tscpaths_cmd, cwd=args.package_dir)

    sys.exit(exit_code)
