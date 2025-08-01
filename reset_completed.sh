#!/bin/bash

echo "Resetting completed challenges..."

# Check if challenges.json exists
if [ ! -f "backend/data/challenges.json" ]; then
    echo "challenges.json not found. Creating empty challenges file..."
    echo "[]" > backend/data/challenges.json
fi

# Call the reset endpoint
curl -X POST http://localhost:8000/challenge/reset-completed \
  -H "Content-Type: application/json" \
  -d '{}'

echo "Completed challenges reset successfully!"
echo "All user progress for completed challenges has been cleared." 