#!/usr/bin/env python3
"""Inspect or publish the explicit DNS records for one EC2 origin."""
import argparse
import ipaddress
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API = "https://api.cloudflare.com/client/v4"


def request(path, query=None, body=None):
    if query:
        path = f"{path}?{urlencode(query)}"
    headers = {"Authorization": f"Bearer {os.environ['CLOUDFLARE_API_TOKEN']}"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = Request(
        API + path, data=json.dumps(body).encode() if body is not None else None,
        headers=headers, method="POST" if body is not None else "GET",
    )
    try:
        with urlopen(req, timeout=20) as response:
            result = json.load(response)
    except HTTPError as error:
        result = json.load(error)
    if not result.get("success"):
        raise ValueError(f"Cloudflare {path}: {result.get('errors', [])}")
    return result["result"]


def run(args):
    zones = request("/zones", {"name": args.zone, "status": "active"})
    if len(zones) != 1 or zones[0]["name"] != args.zone:
        raise ValueError(f"Expected exactly one active Cloudflare zone for {args.zone}")
    zone = zones[0]
    print(f"Cloudflare nameservers for {args.zone}: {', '.join(zone['name_servers'])}")
    if args.action == "zone":
        return

    ip = str(ipaddress.IPv4Address(args.ip))
    records_path = f"/zones/{zone['id']}/dns_records"
    before, posts, patches, deletes, conflicts = [], [], [], [], []
    for name in args.names:
        current = request(records_path, {"name.exact": name, "per_page": 100})
        address_records = [
            record for record in current
            if record["name"] == name and record["type"] in {"A", "AAAA", "CNAME"}
        ]
        if len(address_records) > 1:
            raise ValueError(f"{name} has multiple address records. Review them in Cloudflare first.")
        desired = {"name": name, "type": "A", "content": ip, "proxied": False, "ttl": 120}
        if not address_records:
            print(f"Create DNS-only A {name} -> {ip}")
            posts.append(desired)
            continue
        old = address_records[0]
        if all(old.get(key) == desired[key] for key in ("type", "content", "proxied")):
            print(f"Keep DNS-only A {name} -> {ip}")
            continue
        before.append({
            key: old[key] for key in ("id", "name", "type", "content", "proxied", "ttl", "comment", "tags")
            if key in old
        })
        if old["type"] != "A":
            # Batch applies deletions before creates, so the new A can use the old record's name.
            deletes.append({"id": old["id"]})
            metadata = {key: old[key] for key in ("comment", "tags") if old.get(key)}
            posts.append({**desired, **metadata})
        else:
            patches.append({"id": old["id"], "content": ip, "proxied": False, "ttl": desired["ttl"]})
        conflicts.append(name)
        print(f"Replace {old['type']} {name} -> {old['content']} with DNS-only A -> {ip}")

    if args.action == "plan" or not (posts or patches or deletes):
        return
    if conflicts and not args.replace:
        raise ValueError("Existing records require explicit --replace-dns approval: " + ", ".join(conflicts))
    if before:
        if not args.backup:
            raise ValueError("A backup file is required before replacing records.")
        with Path(args.backup).open("x") as backup:
            json.dump(before, backup, indent=2)
            backup.write("\n")
        print(f"Previous DNS records saved in {args.backup}")
    request(f"{records_path}/batch", body={"deletes": deletes, "patches": patches, "posts": posts})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("zone", "plan", "publish"))
    parser.add_argument("zone")
    parser.add_argument("ip", nargs="?")
    parser.add_argument("names", nargs="*")
    parser.add_argument("--replace-dns", dest="replace", action="store_true")
    parser.add_argument("--backup")
    args = parser.parse_args()
    try:
        run(args)
    except (ValueError, OSError, URLError) as error:
        sys.exit(str(error))


if __name__ == "__main__":
    main()
