#!/usr/bin/env bash
set -e

IMAGE=$1

docker build --target $IMAGE -t test-node-signals .
docker run test-node-signals
echo "docker run exited with code $?"
