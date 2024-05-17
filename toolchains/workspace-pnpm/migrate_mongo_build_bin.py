#!/usr/bin/env python3
"""
Builds an isolated dist tree containing a pruned sub-package and all
production node_modules.
"""
import argparse
import os
import stat

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--package-dir",
        help="Path to the workspace member package",
    )
    parser.add_argument(
        "--migrate-mongo-bin",
        help="Npm binary to execute program with",
    )
    parser.add_argument(
        "--subcmd",
        help="Sub-command to run against migrate-mongo",
    )
    parser.add_argument(
        "--config",
        help="Path to the config file",
    )
    parser.add_argument(
        "bin",
        help="Path to output binary file",
    )

    args = parser.parse_args()
    package_dir_path = os.path.abspath(args.package_dir)
    migrate_mongo_bin_path = os.path.abspath(args.migrate_mongo_bin)

    exec_line = f"exec {migrate_mongo_bin_path} {args.subcmd}"
    if args.config:
        config_file_path = os.path.join(
            package_dir_path,
            args.config
        )
        exec_line += f" -f {config_file_path}"

    binary_content = [
        "#!/usr/bin/env sh",
        f"cd {package_dir_path}",
        exec_line,
        f"cd -",
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
