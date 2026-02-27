#!/bin/sh
set -e

# Install Node.js via Homebrew (not available by default in Xcode Cloud)
brew install node

# Navigate to the project root
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node.js dependencies so Capacitor SPM local packages resolve
npm install
