#!/usr/bin/env python3
"""
Builds a portable, standalone npm binary.
"""
import argparse
import os
import stat

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--bin-out-path",
        help="Path to output binary script",
    )
    parser.add_argument(
        "node_modules",
        help="Path to `node_modules`",
    )
    parser.add_argument(
        "bin",
        help="The binary to create from `node_modules`",
    )

    args = parser.parse_args()

    bins_path = os.path.join(
        os.path.abspath(args.node_modules),
        "node_modules",
        ".bin",
    )

    bin = os.path.join(bins_path, args.bin)
    path = [bins_path]

    content = [
        "#!/usr/bin/env sh",
        "export PATH=\"{}:$PATH\"".format(":".join(path)),
        "exec {} $@".format(bin),
    ]

    with open(args.bin_out_path, "w") as f:
        f.write("\n".join(content))

    os.chmod(
        args.bin_out_path,
        stat.S_IRUSR
        | stat.S_IXUSR
        | stat.S_IRGRP
        | stat.S_IXGRP
        | stat.S_IROTH
        | stat.S_IXOTH,
    )

