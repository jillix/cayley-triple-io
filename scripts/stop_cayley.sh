#!/bin/bash

CAYLEY_PORT=64210
CAYLEY_ROOT=bin/cayley

# check if a cayley instance is already running and kill it 
CAYLEY_PROCESS_PID=`lsof -iTCP:$CAYLEY_PORT -sTCP:LISTEN -t`
if [ "$CAYLEY_PROCESS_PID" ]
then
    kill -9 "$CAYLEY_PROCESS_PID"
fi