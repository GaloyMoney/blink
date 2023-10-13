#!/usr/bin/env python3
"""
Packages a run script that serves a build nextjs app
"""
import argparse
import os
import shutil
import stat
import tempfile

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--next-build",
        help="Path to build",
    )
    parser.add_argument(
        "--next",
        help="Path to next",
    )
    parser.add_argument(
        "bin",
        help="Path to output binary file",
    )

    args = parser.parse_args()

    binary_content = [
        "#!/usr/bin/env sh",
        f"exec {args.next} start \"{args.next_build}\" \"$@\"",
    ]

    binary = args.bin
    os.makedirs(os.path.dirname(args.bin), exist_ok=True)
    with open(binary, "w") as f:
        f.write("\n".join(binary_content) + "\n")
    os.chmod(
        binary,
        stat.S_IRUSR
        | stat.S_IXUSR
        | stat.S_IRGRP
        | stat.S_IXGRP
        | stat.S_IROTH
        | stat.S_IXOTH,
    )
