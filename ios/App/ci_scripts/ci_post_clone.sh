#!/usr/bin/env bash
set -eo pipefail

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE

# Install Node.js (not available by default in Xcode Cloud)
brew install node@20
brew link node@20

# Navigate to the project root
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node.js dependencies so Capacitor SPM local packages resolve
npm ci
