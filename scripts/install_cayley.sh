#!/bin/bash

TMP_DIR=bin
mkdir -p "$TMP_DIR"

MACHINE=`uname -s`

APP_ROOT=`pwd`
CAYLEY_ROOT=bin/cayley
DB_TYPE=mem

function download_cayley {

    if [ "$MACHINE" = "Darwin" ]
    then
        CAYLEY_VERSION=cayley_v0.5.0_darwin_amd64
        CAYLEY_ARCHIVE=$CAYLEY_VERSION.zip
    elif [ "$MACHINE" = "Linux" ]
    then
        CAYLEY_VERSION=cayley_v0.5.0_linux_amd64
        CAYLEY_ARCHIVE=$CAYLEY_VERSION.tar.gz
    else
        echo "No relese archive found"
        exit
    fi

    if [ -e "$TMP_DIR/$CAYLEY_ARCHIVE" ]
    then
        echo "Found Cayley relese archive: $TMP_DIR/$CAYLEY_ARCHIVE"
    else
        echo "No release archive found"
        exit 1
    fi

    echo "Removing old Cayley installation..."
    rm -Rf "$CAYLEY_ROOT"

    mkdir -p bin

    echo "Unpacking Cayley in: bin"

    pushd bin > /dev/null
    tar -xzf ../"$TMP_DIR/$CAYLEY_ARCHIVE"
    popd > /dev/null

    mv "bin/$CAYLEY_VERSION" "$CAYLEY_ROOT"
}

function install_cayley {

    if [ -e "$CAYLEY_ROOT/cayley" ]
    then
        echo "Found Cayley installation in: $CAYLEY_ROOT"
    else
        echo "Installing Cayley in: $CAYLEY_ROOT"
        download_cayley
    fi

    echo "Cayley installed"
}

install_cayley
