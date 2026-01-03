# Setting up a Mac Mini as a Proxy

## Reset

The machine should be as clean as possible to prevent tasks running in the background. This will otherwise distort our measurements.

## Install tools

### Homebrew

https://brew.sh/

### Firefox

Install firefox: https://www.firefox.com/en-US/

### Node Version Manaager

https://github.com/nvm-sh/nvm
(Maybe you need to create `~/.zshrc` first.)

### Git

`$ brew install git`

### pnpm

Install corepack and pnpm
https://pnpm.io/installation#using-corepack

## Install cloudflared

To run a tunnel (https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/#1-create-a-tunnel)
install `cloudflared`:
`$ brew install cloudflared`

## Connect to Github

### SSH key for git repo access

1. Create a new ssh key on your new machine. E.g.:
   `ssh-keygen -t ed25519 -C "Mac Mini Power Measurement Proxy"` and don't add a passphrase.
2. Copy public key
3. Go to this github repo and add `Settings -> Deploy Keys -> Deploy Key` with pull rights only.
4. Clone github repo to machine.

### Create .env

Make sure to add browsertime port and add the cloudflare tunnel key.

## Connect cloudflare tunnel

1. Login to cloudflare: `$ cloudflared tunnel login`
2. Create a new tunnel with `$ cloudflared create tunnel <TUNNEL-NAME>`
3. Link in `config.yml` to the credentials json created in `~/.cloudflared/<TUNNEL-ID>.json`
4. Set up routing: `$ cloudflared tunnel route dns [TUNNEL-NAME] power-proxy.784516.xyz`
   a. if that does not work because of existing records go to `Cloudflare Dashboard -> DNS -> Records` and delete the CNAME record.
5. Create a config in `~/.cloudflared/config.yml` taking `../.cloudflared/config.yml.example` as an example
6. `cd [REPO-PATH]` and run tunnel `$ cloudflared tunnel run [TUNNEL-NAME]`

### Permanent tunnel

To run a permanent tunnel on startup:
`$ brew services start cloudflared`
to stop this again:
`$ brew services stop cloudflared`
