#!/bin/bash

commitHelpScript=#[[values.commitHelpScript]]
alias commithelp="node ${commitHelpScript}"

function commit() {
  prefix_conventional_commit="$(commithelp commit $@)"
  if [ -z "$prefix_conventional_commit" ]; then
  else
    echo
    echo "Commit message:"
    echo "    $prefix_conventional_commit"
    echo
    echo "[Press enter to continue or Ctrl-C to abort]"
    read -n 1 confirm
    git commit -m "$prefix_conventional_commit"
  fi
}

