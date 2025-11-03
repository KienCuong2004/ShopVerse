#!/bin/bash
# Cleanup script for Next.js development server
# This script kills any existing Node.js processes and removes lock files

echo "Cleaning up Next.js development environment..."

# Kill Node.js processes on ports 3000 and 3001
for port in 3000 3001; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        echo "Killed process on port $port"
    fi
done

# Remove lock files
if [ -f ".next/dev/lock" ]; then
    rm -f .next/dev/lock
    echo "Removed lock file"
fi

# Wait a moment
sleep 1

echo "Cleanup complete!"

