#!/usr/bin/env python3
"""
Builds an isolated dist tree containing a pruned sub-package and all
production node_modules.
"""
import argparse
import hashlib
import os
import stat

def hash_dir(dir_path):
    def hash_file(filepath):
        """Hash a single file using SHA-256 and return the hex digest."""
        hasher = hashlib.sha256()
        with open(filepath, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()

    def hash_directory(directory_path):
        """Recursively hash all files in directory and return a dictionary of file paths and their hashes."""
        file_hashes = {}
        for root, dirs, files in os.walk(directory_path):
            for filename in files:
                filepath = os.path.join(root, filename)
                file_hashes[filepath] = hash_file(filepath)
        return file_hashes

    def combine_hashes(file_hashes):
        """Combine file hashes into a single directory fingerprint."""
        combined_hash_string = ''.join(hash_val for _, hash_val in sorted(file_hashes.items()))
        return hashlib.sha256(combined_hash_string.encode()).hexdigest()

    file_hashes = hash_directory(dir_path)

    return combine_hashes(file_hashes)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--package-dir",
        help="Path to the workspace member package",
    )
    parser.add_argument(
        "--prod-dist-path",
        help="Path to the workspace member package",
    )
    parser.add_argument(
        "--preload-file",
        help="Path to js preload file for bin",
    )
    parser.add_argument(
        "--run-file",
        help="Path to js run file for bin",
    )
    parser.add_argument(
        "bin",
        help="Path to output binary file",
    )

    args = parser.parse_args()

    dist_path = os.path.join(
        os.path.abspath(args.prod_dist_path),
        args.package_dir,
        "dist",
    )

    if args.preload_file is not None:
        preload_path = os.path.join(dist_path, args.preload_file)
        js_path = os.path.join(dist_path, args.run_file)
        binary_content = [
            "#!/usr/bin/env sh",
            f"exec node -r \"{preload_path}\" \"{js_path}\" \"$@\""
        ]
    else:
        js_path = os.path.join(dist_path, args.run_file)
        binary_content = [
            "#!/usr/bin/env sh",
            "",
            f"# TODO: execute natively in buck by figuring out some way to make the 'prod_tsc_build_bin'",
            f"#       rule return a changed state of its deps for any consuming rules.",
            f"# Deps hash: {hash_dir(dist_path)}",
            "",
            f"exec node \"{js_path}\" \"$@\""
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
