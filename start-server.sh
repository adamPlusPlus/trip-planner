#!/bin/bash
# Start script to run both the file server and Vite dev server

echo "Starting file server on port 8000..."
cd .. && python -m http.server 8000 &
FILE_SERVER_PID=$!

echo "Waiting for file server to start..."
sleep 2

echo "Starting Vite dev server..."
cd road-trip-planner && npm run dev

# Cleanup on exit
trap "kill $FILE_SERVER_PID" EXIT

