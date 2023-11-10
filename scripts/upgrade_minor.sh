#!/bin/bash

# Function to execute a command and check its status
execute() {
    "$@"
    local status=$?
    if [ $status -ne 0 ]; then
        echo "error with $1" >&2
        exit $status
    fi
    return $status
}

# checkout main branch
execute git checkout main

# pull latest changes
execute git pull

# create new chore/update-deps-<ISO_DATE> branch
execute git checkout -b chore/update-deps-"$(date +%Y%m%d)"

execute find . -type f -name "package.json" -depth 2 -execdir npx npm-check-updates -t minor -u \;
execute find . -type f -name "package-lock.json" -depth 2 -execdir npm install \;

execute git add ./*/package*.json
execute git commit -m "chore: update dependencies"
