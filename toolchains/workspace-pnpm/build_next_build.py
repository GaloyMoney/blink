#!/usr/bin/env python3
"""
Runs a tsc compilation.
"""
import argparse
import subprocess
import sys
import os
import shutil
import time


def create_symlink(src, dest, description=""):
    """Create a symlink from src to dest, handling existing destinations."""
    # Ensure the source exists
    if not os.path.exists(src):
        print(f"Error: Source directory {src} does not exist", file=sys.stderr)
        return False

    # Ensure the parent directory exists
    parent_dir = os.path.dirname(dest)
    os.makedirs(parent_dir, exist_ok=True)

    # Remove destination if it exists
    if os.path.exists(dest):
        if os.path.islink(dest):
            os.unlink(dest)
        else:
            shutil.rmtree(dest)

    # Create the symlink
    src_absolute = os.path.abspath(src)
    desc_text = f" ({description})" if description else ""
    print(f"Creating symlink{desc_text}: {src_absolute} -> {dest}", file=sys.stderr)
    os.symlink(src_absolute, dest, target_is_directory=True)
    print(f"Symlink{desc_text} created successfully", file=sys.stderr)
    return True


def run_command(cmd, cwd=None, env=None, timeout=1800):
    """Run a command with improved error handling and timeout."""
    print(f"Running command: {' '.join(cmd)} in {cwd}", file=sys.stderr)
    try:
        process = subprocess.Popen(
            cmd,
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )

        # Poll the process with timeout
        start_time = time.time()
        while process.poll() is None:
            if time.time() - start_time > timeout:
                process.terminate()
                time.sleep(1)
                if process.poll() is None:
                    process.kill()
                print(f"Error: Command timed out after {timeout} seconds", file=sys.stderr)
                return 1
            time.sleep(1)  # Check every second

        # Get output and error
        stdout, stderr = process.communicate()
        exit_code = process.returncode

        # Print output on error
        if exit_code != 0:
            print(f"Command failed with exit code {exit_code}", file=sys.stderr)
            print("STDOUT:", file=sys.stderr)
            print(stdout, file=sys.stderr)
            print("STDERR:", file=sys.stderr)
            print(stderr, file=sys.stderr)

        return exit_code
    except Exception as e:
        print(f"Error running command: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root-dir",
        help="Path to the root",
    )
    parser.add_argument(
        "--package-dir",
        help="Directory of the package",
    )
    parser.add_argument(
        "--build-env",
        action="append",
        default=[],
        help="Environment variables in the format ENV=path, to pass to next build",
    )
    parser.add_argument(
        "out_path",
        help="Path to output directory",
    )

    args = parser.parse_args()

    next_cmd = [
        os.path.relpath("node_modules/.bin/next"),
        "build"
    ]

    app_dir = os.path.join(args.root_dir, args.package_dir)
    build_out_dir = os.path.join(app_dir, ".next")

    # Set up environment variables
    env = os.environ.copy()
    for env_pair in args.build_env:
        key, val = env_pair.split('=')
        env[key] = val

    # Run the next build command
    exit_code = run_command(next_cmd, cwd=app_dir, env=env)
    if exit_code != 0:
        sys.exit(exit_code)

    # Create output directories and symlinks
    try:
        # Create main output directory
        os.makedirs(args.out_path, exist_ok=True)

        # Create .next symlink
        if not create_symlink(
            build_out_dir,
            os.path.join(args.out_path, ".next"),
            "main .next"
        ):
            sys.exit(1)

        # Handle the public directory
        public_src = os.path.join(app_dir, "public")
        if os.path.exists(public_src):
            standalone_dir = os.path.join(args.out_path, ".next", "standalone", args.package_dir)
            os.makedirs(standalone_dir, exist_ok=True)

            if not create_symlink(
                public_src,
                os.path.join(standalone_dir, "public"),
                "public"
            ):
                sys.exit(1)

        # Handle the static directory
        static_src = os.path.join(build_out_dir, "static")
        if os.path.exists(static_src):
            standalone_next_dir = os.path.join(args.out_path, ".next", "standalone", args.package_dir, ".next")
            os.makedirs(standalone_next_dir, exist_ok=True)

            if not create_symlink(
                static_src,
                os.path.join(standalone_next_dir, "static"),
                "static"
            ):
                sys.exit(1)

    except Exception as e:
        print(f"Error during file operations: {e}", file=sys.stderr)
        sys.exit(1)

    sys.exit(0)
