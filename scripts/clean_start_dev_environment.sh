#!/bin/bash

# Get flags provided

while getopts "d" flag; do
 case $flag in
   d)
   init_db=true
   ;;
   \?)
   echo "Invalid flags provided"
   exit 1
   ;;
 esac
done



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

execute find . -type f -name "package.json" -maxdepth 2 -execdir sh -c 'rm -rf node_modules && npm i' \; &&
execute docker compose build --no-cache && docker compose up -d

if [ "$init_db" = true ]; then
    execute docker compose exec -it backend npm run db-migrate
fi