#!/bin/bash
set -eo pipefail

echo "=== DEBUG: PATH ==="
echo "$PATH"
echo "=== DEBUG: which bash ==="
which bash || echo "bash not found"
echo "=== DEBUG: which brew ==="
which brew || echo "brew not found"
echo "=== DEBUG: ls /usr/local/bin/brew ==="
ls -la /usr/local/bin/brew 2>&1 || echo "not at /usr/local/bin"
echo "=== DEBUG: ls /opt/homebrew/bin/brew ==="
ls -la /opt/homebrew/bin/brew 2>&1 || echo "not at /opt/homebrew"
echo "=== DEBUG: uname -m ==="
uname -m

# Try to find brew
if command -v brew &>/dev/null; then
  BREW=brew
elif [ -x /usr/local/bin/brew ]; then
  BREW=/usr/local/bin/brew
elif [ -x /opt/homebrew/bin/brew ]; then
  BREW=/opt/homebrew/bin/brew
else
  echo "ERROR: Homebrew not found anywhere"
  exit 1
fi

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE
$BREW install node@20
$BREW link node@20

cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci
