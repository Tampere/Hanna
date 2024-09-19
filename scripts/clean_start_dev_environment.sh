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

execute cd ./frontend && rm -rf node_modules && npm i && cd ..
execute cd ./backend && rm -rf node_modules && npm i && cd ..
execute cd ./shared && rm -rf node_modules && npm i && cd ..
execute docker compose build --no-cache && docker compose up -d

if [ "$init_db" = true ]; then
    execute docker compose exec -it backend npm run db-migrate
fi