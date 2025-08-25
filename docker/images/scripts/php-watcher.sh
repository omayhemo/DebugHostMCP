#!/bin/sh
# docker/images/scripts/php-watcher.sh

WATCH_DIR="/app"
COMMAND="$@"

echo "Starting PHP with file watching..."
echo "Watching: $WATCH_DIR"
echo "Command: $COMMAND"

# Initial run
$COMMAND &
PID=$!

# Watch for changes
inotifywait -m -r -e modify,create,delete --format '%w%f' \
  --exclude '\.(git|svn|hg)|vendor/|\.swp$|\.tmp$' \
  "$WATCH_DIR" | while read file
do
  if [[ "$file" =~ \.php$ ]]; then
    echo "File changed: $file"
    echo "Restarting PHP..."
    kill $PID 2>/dev/null
    wait $PID 2>/dev/null
    $COMMAND &
    PID=$!
  fi
done