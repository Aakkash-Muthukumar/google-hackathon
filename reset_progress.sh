#!/bin/bash

echo "Resetting user progress..."

# Navigate to backend directory
cd backend

# Run the reset service using Python
python3 -c "
from services.reset_service import reset_user_progress
result = reset_user_progress('default_user')
print('Reset result:', result)
"

echo "User progress reset successfully!"
echo "All progress data has been reset while preserving content data." 