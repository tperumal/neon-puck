#!/bin/bash
set -eo pipefail

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE

# Install Node.js (not pre-installed in Xcode Cloud)
brew install node@20

# Add node to PATH (brew link may fail if node is keg-only)
export PATH="/usr/local/opt/node@20/bin:$(brew --prefix node@20)/bin:$PATH"

echo "=== node version ==="
node --version
echo "=== npm version ==="
npm --version

# Navigate to the project root
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node.js dependencies so Capacitor SPM local packages resolve
npm ci
