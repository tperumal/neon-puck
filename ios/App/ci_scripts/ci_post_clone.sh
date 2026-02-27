#!/bin/bash
set -x

echo "Script started"
echo "PATH: $PATH"

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
brew install node@20

export PATH="$(brew --prefix node@20)/bin:$PATH"

echo "node: $(node --version)"
echo "npm: $(npm --version)"

cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install
