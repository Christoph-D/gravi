#!/bin/bash

if which inotifywait >/dev/null; then
  echo 'Watching the source directory for changes.'
else
  echo 'Recompiling every 1.0s because inotify-tools for efficient watching is unavailable.'
fi

compile() {
  src=$1
  out=$2
  coffee=${out%.js}.coffee
  # Ignore the output because coffeescript-concat sometimes fails when
  # it tries to concat temporary hidden files created by an editor.
  ./coffeescript-concat/coffeescript-concat -I "$src" -o "$coffee" #2>/dev/null
  # Recompile to javascript
  coffee -bco "${out%/*}" "$coffee"
  rm -f "$coffee"
}

while :; do
  echo -n 'Recompiling...' | ts
  compile coffee js/gralog.js
  compile spec jasmine/spec/gralog.js
  echo 'done'
  if which inotifywait >/dev/null; then
    inotifywait -qqre modify,create,delete,move --exclude '/\.[^/]*' coffee spec
  else
    sleep 1
  fi
done
