#!/bin/bash

if ! coffee --help &>/dev/null; then
  echo 'Please install coffee-script:'
  echo '$ npm install coffee-script'
  echo 'And possibly add the following line to ~/.profile or ~/.bashrc or similar:'
  echo 'export PATH="$HOME/node_modules/.bin:$PATH"'
  exit 1
fi

mapping='-m'
if ! coffee -m --help &>/dev/null; then
  echo 'Your coffee-script version is:'
  coffee --version
  echo 'This seems to be older than 1.6.'
  echo 'Please upgrade coffee-script in order to use source maps.'
  echo
  mapping=''
fi

if which inotifywait >/dev/null; then
  echo 'Watching the source directory for changes.'
else
  echo -n 'Cannot find inotifywait.'
  if [[ $(lsb_release -is 2>/dev/null) = Ubuntu ]]; then
    echo ' You can fix this with:'
    echo 'sudo apt-get install inotify-tools'
  else
    echo
  fi
  echo
  echo 'Recompiling every 1.0s because inotifywait for efficient watching is unavailable.'
fi

compile() {
  coffee=js/gralog.coffee
  # Ignore the output because coffeescript-concat sometimes fails when
  # it tries to concat temporary hidden files created by an editor.
  ./coffeescript-concat/coffeescript-concat -I coffee -o "$coffee" 2>/dev/null
  # Recompile to javascript
  coffee $mapping -bco js/ "$coffee"
}
compiletests() {
  coffee=jasmine/spec/gralog.coffee
  cat spec/*.coffee > "$coffee"
  coffee $mapping -bco jasmine/spec/ "$coffee"
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
