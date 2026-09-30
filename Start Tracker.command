#!/bin/zsh
# Double-click in Finder to start the Internship Tracker.
# Starts the app (npm run dev) and opens it in your browser.
# Keep this Terminal window open while you use the tracker; close it (or press Ctrl+C) to stop.

cd "$(dirname "$0")" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
URL="http://localhost:5173"

# Already running (e.g. you double-clicked twice)? Just open the browser.
if curl -s -o /dev/null "$URL"; then
  echo "The tracker is already running. Opening $URL"
  open "$URL"
  exit 0
fi

# First run on this Mac, or after new packages were added
[ -d node_modules ] || npm install

# Open the browser as soon as the server answers (checks for up to 30 seconds)
(
  for _ in {1..60}; do
    if curl -s -o /dev/null "$URL"; then open "$URL"; exit 0; fi
    sleep 0.5
  done
) &

echo "Starting the tracker… (keep this window open; Ctrl+C to stop)"
npm run dev
