#!/bin/sh
# wait-for-mongodb.sh

set -e
  
# Shift arguments with mapping:
# - $0 => $0
# - $1 => <discarded>
# - $2 => $1
# - $3 => $2
# - ...
# This is done for `exec "$@"` below to work correctly
# shift
  
# Login for user (`-U`) and once logged in execute quit ( `-c \q` )
# If we can not login sleep for 1 sec
until mongosh --eval 'db.runCommand("ping").ok' mongodb://galoy-mongodb-1:27017/galoy --username testGaloy --password password --quiet; do
  >&2 echo "Mongodb is unavailable - sleeping"
  sleep 1
done
  
>&2 echo "Mongodb is up - executing command"
# Print and execute all other arguments starting with `$1`
# So `exec "$1" "$2" "$3" ...`
exec "$@"