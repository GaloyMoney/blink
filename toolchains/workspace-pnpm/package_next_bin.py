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
        "--package-dir",
        help="Directory of the package",
    )
    parser.add_argument(
        "out",
        help="Path to output binary file",
    )

    args = parser.parse_args()

    shutil.copytree(
        os.path.join(args.next_build, ".next", "standalone"),
        os.path.join(args.out, "lib"),
        symlinks=True,
        dirs_exist_ok=True,
        )

    js_path = '${0%/*}/../lib/' + args.package_dir + '/server.js'
    binary_content = [
        "#!/usr/bin/env sh",
        f"exec node \"{js_path}\" \"$@\"",
    ]

    binary = os.path.join(args.out, "bin", "run")
    os.makedirs(os.path.dirname(binary), exist_ok=True)
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
