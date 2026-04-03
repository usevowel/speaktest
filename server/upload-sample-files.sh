#!/bin/bash
# Script to upload sample markdown files to R2 storage
# Usage: ./upload-sample-files.sh [bucket-name] [env] [--local]
# Examples:
#   ./upload-sample-files.sh speaktest-dev development
#   ./upload-sample-files.sh speaktest-dev development --local
#   ./upload-sample-files.sh speaktest production

set -e

BUCKET_NAME="${1:-speaktest-dev}"
ENV="${2:-development}"
LOCAL_FLAG="${3:-}"

# Check if --local flag is provided
USE_LOCAL=false
if [ "$LOCAL_FLAG" = "--local" ] || [ "$3" = "--local" ] || [ "$2" = "--local" ]; then
  USE_LOCAL=true
  ENV="${2:-development}"
  if [ "$2" = "--local" ]; then
    ENV="development"
  fi
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SAMPLE_DIR="$PROJECT_ROOT/sample-project"

if [ "$USE_LOCAL" = true ]; then
  echo "📤 Uploading sample markdown files to LOCAL Miniflare R2 bucket: $BUCKET_NAME"
  echo "📁 Source directory: $SAMPLE_DIR"
  echo "⚠️  Note: Make sure 'wrangler dev --local' is running in another terminal!"
else
  echo "📤 Uploading sample markdown files to R2 bucket: $BUCKET_NAME (env: $ENV)"
  echo "📁 Source directory: $SAMPLE_DIR"
fi

# Check if sample directory exists
if [ ! -d "$SAMPLE_DIR" ]; then
  echo "❌ Error: Sample directory not found: $SAMPLE_DIR"
  exit 1
fi

# Upload each markdown file
for file in "$SAMPLE_DIR"/*.md; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    object_key="projects/sample-project/$filename"
    
    echo "  📄 Uploading $filename -> $object_key"
    
    # Build wrangler command
    if [ "$USE_LOCAL" = true ]; then
      # For local Miniflare, use --local flag
      cmd="wrangler r2 object put \"$BUCKET_NAME/$object_key\" --file=\"$file\" --content-type=\"text/markdown\" --local"
    elif [ "$ENV" = "production" ]; then
      cmd="wrangler r2 object put \"$BUCKET_NAME/$object_key\" --file=\"$file\" --content-type=\"text/markdown\" --remote"
    else
      cmd="wrangler r2 object put \"$BUCKET_NAME/$object_key\" --file=\"$file\" --content-type=\"text/markdown\" --env=\"$ENV\" --remote"
    fi
    
    # Execute the command
    eval $cmd
    
    if [ $? -eq 0 ]; then
      echo "    ✅ Successfully uploaded $filename"
    else
      echo "    ❌ Failed to upload $filename"
      if [ "$USE_LOCAL" = true ]; then
        echo "    💡 Tip: Make sure 'wrangler dev --local' is running!"
      fi
      exit 1
    fi
  fi
done

echo ""
echo "✅ All sample markdown files uploaded successfully!"
echo "📋 Files uploaded:"
ls -1 "$SAMPLE_DIR"/*.md | xargs -n1 basename

if [ "$USE_LOCAL" = true ]; then
  echo ""
  echo "💡 These files are now in your local Miniflare R2 bucket."
  echo "   They will persist until you restart 'wrangler dev --local'"
fi
