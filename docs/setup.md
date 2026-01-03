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

## Connect

### SSH key for git repo access

1. Create a new ssh key on your new machine. E.g.:
   `ssh-keygen -t ed25519 -C "Mac Mini Power Measurement Proxy"` and don't add a passphrase.
2. Copy public key
3. Go to this github repo and add `Settings -> Deploy Keys -> Deploy Key` with pull rights only.
4. Clone github repo to machine.

### Create .env
