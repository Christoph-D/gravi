#!/bin/bash

if which inotifywait >/dev/null; then
  echo 'Watching the source directory for changes.'
else
  echo 'Recompiling every 1.0s because inotify-tools for efficient watching is unavailable.'
fi

compile() {
  coffee=js/gralog.coffee
  # Ignore the output because coffeescript-concat sometimes fails when
  # it tries to concat temporary hidden files created by an editor.
  ./coffeescript-concat/coffeescript-concat -I coffee -o "$coffee" 2>/dev/null
  # Recompile to javascript
  coffee -mbco js/ "$coffee"
}
compiletests() {
  coffee=jasmine/spec/gralog.coffee
  cat spec/*.coffee > "$coffee"
  coffee -mbco jasmine/spec/ "$coffee"
}

while :; do
  echo -n 'Recompiling...' | ts
  compile
  compiletests
  echo 'done'
  if which inotifywait >/dev/null; then
    inotifywait -qqre modify,create,delete,move --exclude '/\.[^/]*' coffee spec
  else
    sleep 1
  fi
done
