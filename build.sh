#!/bin/bash

if which inotifywait >/dev/null; then
  echo 'Watching the source directory for changes.'
else
  echo 'Recompiling every 1.0s because inotify-tools for efficient watching is unavailable.'
fi

compile() {
  # Ignore the output because coffeescript-concat sometimes fails when
  # it tries to concat temporary hidden files created by an editor.
  ./coffeescript-concat/coffeescript-concat -I coffee -o js/gralog.coffee 2>/dev/null
  # Recompile to javascript
  coffee -co js/ js/gralog.coffee
  rm -f js/gralog.coffee
}

while :; do
  echo -n 'Recompiling...' | ts
  compile
  echo 'done'
  if which inotifywait >/dev/null; then
    inotifywait -qqre modify,create,delete,move --exclude '/\.[^/]*' coffee/
  else
    sleep 1
  fi
done
