#!/bin/sh

find . -path */node_modules -prune -o -name yarn.lock -print

