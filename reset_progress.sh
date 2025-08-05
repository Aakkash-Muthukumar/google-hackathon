#!/bin/bash

echo "Resetting user progress..."

# Reset progress.json
cat > backend/data/progress.json << EOF
{
  "default_user": {
    "total_xp": 0,
    "completed_challenges": [],
    "level": 1
  }
}
EOF

echo "User progress reset successfully!"
echo "All completed challenges have been cleared." 