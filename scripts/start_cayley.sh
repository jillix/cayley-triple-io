#!/bin/bash

APP_ROOT=`pwd`
CAYLEY_PORT=64210

CAYLEY_ROOT=bin/cayley
DB_TYPE=mem
CAYLEY_DEFAULT_DB=test/testData.nq

# check if a cayley instance is already running and kill it 
CAYLEY_PROCESS_PID=`lsof -iTCP:$CAYLEY_PORT -sTCP:LISTEN -t`
if [ "$CAYLEY_PROCESS_PID" ]
then
    echo "Found cayley process"
else
    # check if cayley is installed
    if [ -e "$CAYLEY_ROOT/cayley" ]
    then
        echo "Found Cayley installation in: $CAYLEY_ROOT"
    else
        "$APP_ROOT/scripts/install_cayley.sh"
    fi

    echo "Using default"

    # start cayley with default settings
    cd "$CAYLEY_ROOT"
    `./cayley http --dbpath=$APP_ROOT/$CAYLEY_DEFAULT_DB > /dev/null &`
fi
