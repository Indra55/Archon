# Deploy Archon on AWS

This workflow installs Next.js, the Express API, the Python agent, PostgreSQL with pgvector, and Neo4j on a dedicated Ubuntu EC2 instance. The default is `t3.medium` with a 60 GiB encrypted gp3 disk in `ap-south-1`. The CloudFormation stack provisions an Elastic IP, a public subnet and security group, operator-restricted SSH, and IMDSv2. Nginx serves HTTPS and asks for operator credentials. The signed GitHub webhook endpoint is public. Certbot uses Cloudflare DNS-01 and reloads Nginx on renewal.

## One-time setup

1. Install AWS CLI v2 and sign in to the new AWS account with credentials that can manage CloudFormation, EC2 networking and key pairs, and read the public Ubuntu AMI parameter. [AWS CLI installation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. Create or import an EC2 SSH key in the region you will deploy to. Set `SSH_PRIVATE_KEY` to the absolute private key path and `ADMIN_CIDR` to your public IPv4 followed by `/32`.
3. Create a Cloudflare API token limited to `hitanshu.xyz` with **Zone → Zone → Read** and **Zone → DNS → Edit**. Hostinger can remain the registrar. Cloudflare already serves the authoritative nameservers. [Cloudflare API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
4. Register a GitHub OAuth app with homepage `https://archon.hitanshu.xyz` and callback `https://archon.hitanshu.xyz/backend/auth/github/callback`. Set its client ID and secret in the private config. [GitHub OAuth app registration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
5. Create an OpenRouter key and set `OPENROUTER_API`. Configure the GitHub PAT and target repository when you are ready to index a repo. [OpenRouter key settings](https://openrouter.ai/settings/keys)

A new key pair can be imported from your local SSH public key:

```sh
ssh-keygen -t ed25519 -f "$HOME/.ssh/archon-deploy"
aws ec2 import-key-pair --region ap-south-1 --key-name archon-deploy \
  --public-key-material "fileb://$HOME/.ssh/archon-deploy.pub"
```

Load a passphrase-protected key into your SSH agent before running the script.

## Provision and publish

Run from a Linux checkout with Bash, Git, OpenSSH, Python 3, and curl.

```sh
git clone https://github.com/Indra55/Archon.git
cd Archon
cp deploy/aws/config.example deploy/aws/production.local
chmod 600 deploy/aws/production.local
${EDITOR:-nano} deploy/aws/production.local
```

Fill the blank values. Generate a unique operator password with `openssl rand -hex 16`. Use the config's hostnames when registering external callbacks.

```sh
./deploy/aws/deploy.sh plan deploy/aws/production.local
./deploy/aws/deploy.sh prepare deploy/aws/production.local
./deploy/aws/deploy.sh dns-plan deploy/aws/production.local
./deploy/aws/deploy.sh publish deploy/aws/production.local --replace-dns
./deploy/aws/deploy.sh verify deploy/aws/production.local
```

`plan` is optional and creates an unexecuted change set. `prepare` applies the stack, uploads the Git release, installs the services, and checks the new HTTPS origin directly using the configured hostname. You can run it again to deploy an update. It uses the committed checkout by default. Use `prepare deploy/aws/production.local --worktree` if you want to deploy local, uncommitted changes.

`publish` checks the origin again and then writes the selected Cloudflare DNS-only record. `--replace-dns` authorizes replacing a conflicting address record and saves the old record settings beside your private config. Review `dns-plan` before using it. To roll back DNS, restore those exact records in Cloudflare and remove any newly created records you intend to withdraw. [Cloudflare wildcard DNS](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/)

`verify` checks public DNS resolves to the stack's Elastic IP and then probes the application over TLS. `ssh` opens the configured EC2 host. Database data and secrets persist across application releases. CloudFormation retains the encrypted EBS volume on instance termination; it incurs storage charges until removed. The EC2 instance, storage, and public IP are billable AWS resources.

## Verify connected features

1. Open `https://archon.hitanshu.xyz/setup`, enter the operator credentials, and use a small GitHub repository you control and a scoped PAT. Set up the organization, then sign in through GitHub. Verify a normal session reaches the dashboard.
2. Generate a small architecture and download its scaffold ZIP. This exercises the actual OpenRouter workflow. Set `OPENROUTER_MODEL` to a model your key can use if the default is unavailable.
3. Add `GITHUB_TOKEN`, `GITHUB_REPO=owner/repo` and `GITHUB_BRANCH` to the private config and rerun `prepare` if you want CLI ingestion. Use the repo's exact GitHub name and an OpenRouter key with access to the configured chat model and `thenlper/gte-base` embeddings.
4. On the origin, run the commands below. Inspect the real repository name and citations in Codebase Q&A and the Knowledge Graph.
5. For webhook delivery, confirm GitHub points to `https://archon.hitanshu.xyz/api/v1/webhook/github`, with JSON content type and the same generated signing secret used by the agent. Archon can register hooks with a token that has repository webhook access. The agent uses one configured repo for webhook automation. Enable pull-request events only when you want Archon to run reviews, which can post comments and update README content. Some dashboard panels ship with sample content independently of this stack.

```sh
cd /opt/archon/current
sudo docker compose -p archon --env-file .deploy.env -f deploy/aws/compose.yml \
  exec agent python -m agent.scripts.ingest_repo
sudo docker compose -p archon --env-file .deploy.env -f deploy/aws/compose.yml \
  logs --tail=100 api agent web
sudo certbot renew --cert-name archon-production --dry-run
```

## Data and migration

Run `sudo bash /opt/archon/current/deploy/aws/backup.sh` on the origin. This briefly pauses the web/API/agent and Neo4j while capturing PostgreSQL and the graph. Copy the private archives and their checksums off the instance to encrypted storage.

For a previous installation, retain a PostgreSQL custom-format dump, the offline Neo4j `neo4j` and `system` dumps if available, and the original `ENCRYPTION_KEY`, JWT key, and webhook secret. Stage the restore on its own EC2 origin. Restore PostgreSQL into an empty, pgvector-enabled database with `pg_restore --exit-on-error --no-owner --no-privileges`. Stop the destination Neo4j container before loading the dumps into its data volume with `neo4j-admin database load`. Preserve the Neo4j account credentials if restoring the `system` database. Bring forward the original encryption key before launching the API so stored repository tokens remain readable. Rerun `prepare`, verify users and indexed repositories, then cut over DNS. Reingestion is an option when you have repository access and want to rebuild rather than transfer the graph. [Neo4j offline restore](https://neo4j.com/docs/operations-manual/current/backup-restore/restore-dump/)
