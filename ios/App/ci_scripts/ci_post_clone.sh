#!/bin/sh
set -e

# Navigate to the project root (3 levels up from ci_scripts/)
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node.js dependencies so Capacitor SPM local packages resolve
npm install
