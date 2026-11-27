#!/usr/bin/env bash
set -euo pipefail

usage() {
    echo "Usage: $0 {plan|apply} {holonet|archon} STACK REGION KEY_PAIR ADMIN_CIDR [INSTANCE_TYPE] [DISK_GIB]"
}

if [[ ${1:-} == --help ]]; then usage; exit 0; fi
if (( $# < 6 || $# > 8 )); then usage >&2; exit 2; fi
action=$1 app=$2 stack=$3 region=$4 key=$5 admin_cidr=$6
instance_type=${7:-t3.medium}
disk_size=${8:-60}
[[ $action == plan || $action == apply ]] || { usage >&2; exit 2; }
[[ $app == holonet || $app == archon ]] || { usage >&2; exit 2; }
python3 - "$admin_cidr" <<'PYTHON'
import ipaddress
import sys

try:
    network = ipaddress.IPv4Network(sys.argv[1])
    if network.prefixlen == 0:
        raise ValueError()
except ValueError:
    sys.exit("Enter an operator IPv4 CIDR, typically your public IP followed by /32.")
PYTHON

directory=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
aws=(aws --region "$region")
"${aws[@]}" sts get-caller-identity --output table
"${aws[@]}" ec2 describe-key-pairs --key-names "$key" --query 'KeyPairs[0].KeyName' --output text
if stack_description=$("${aws[@]}" cloudformation describe-stacks --stack-name "$stack" \
    --query "Stacks[0].Parameters[?ParameterKey=='UbuntuAmi'].ParameterValue | [0]" --output text 2>&1); then
    ami=$stack_description
elif [[ $stack_description == *"Stack with id $stack does not exist"* ]]; then
    ami=$("${aws[@]}" ssm get-parameter \
        --name /aws/service/canonical/ubuntu/server/noble/stable/current/amd64/hvm/ebs-gp3/ami-id \
        --query Parameter.Value --output text)
else
    printf '%s\n' "$stack_description" >&2
    exit 1
fi
[[ $ami =~ ^ami-[a-f0-9]+$ ]] || { echo 'Expected a pinned Ubuntu AMI ID.' >&2; exit 1; }

args=(--template-file "$directory/ec2.yml" --stack-name "$stack" --no-fail-on-empty-changeset
      --parameter-overrides "App=$app" "KeyName=$key" "AdminCidr=$admin_cidr"
      "InstanceType=$instance_type" "DiskGiB=$disk_size" "UbuntuAmi=$ami")
if [[ $action == plan ]]; then
    "${aws[@]}" cloudformation deploy "${args[@]}" --no-execute-changeset
else
    "${aws[@]}" cloudformation deploy "${args[@]}"
    "${aws[@]}" cloudformation describe-stacks --stack-name "$stack" \
        --query 'Stacks[0].Outputs' --output table
fi
