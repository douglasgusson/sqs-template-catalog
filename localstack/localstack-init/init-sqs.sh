#!/bin/bash
set -euo pipefail

# Enable debug mode if needed
# set -x

echo "Configuring SQS queues..."
echo "==========================="

awslocal sqs create-queue --queue-name my-test-queue --region us-east-1

echo "SQS queue setup complete."
