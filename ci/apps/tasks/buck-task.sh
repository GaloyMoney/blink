#!/bin/bash

set -e

cd repo

buck2 ${BUCK_CMD} ${BUCK_TARGET}
