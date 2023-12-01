#!/usr/bin/env python3
"""
Runs audit for npm dependencies.
"""
import argparse
import json
import subprocess
import sys

def sum_severities(severity_dict, start_level):
    severity_order = [
        "low",
        "moderate",
        "high",
        "critical"
    ]

    start_index = severity_order.index(start_level)
    return sum(
        severity_dict[level]
        for level in severity_order[start_index:]
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--audit-level",
        help="Audit severity to print advisories against.",
    )
    parser.add_argument(
        "args",
        help="Audit arguments",
        nargs=argparse.REMAINDER,
    )

    args = parser.parse_args()
    audit_args = args.args[1:] # ignore '--' separator

    pnpm_cmd = ["pnpm", "audit"]
    audit_cmd = [*pnpm_cmd, *audit_args]
    audit_cmd_json_out = [*audit_cmd, "--json"]

    result = subprocess.run(audit_cmd_json_out, stdout=subprocess.PIPE)
    try:
        result_dict = json.loads(result.stdout)
    except:
        print("Could not parse audit response. Got 'result.stdout' value:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        sys.exit(1)

    num_vulns = sum_severities(
        result_dict["metadata"]["vulnerabilities"],
        args.audit_level
    )
    if num_vulns > 0:
        printable_result = subprocess.run(audit_cmd, stdout=subprocess.PIPE, text=True)
        print(printable_result.stdout)
        sys.exit(1)

    sys.exit(0)
