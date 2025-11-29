#!/usr/bin/env bash
# pexels-download.sh

# Set your Pexels API key (or export PEXELS_API_KEY in your env)
API_KEY="${PEXELS_API_KEY:-MXUI3OEJ74nT1mwGLoLfpNN1nJgrkYcWOlFVXE0LHml573B7CSclQlwx}"

if [ "$API_KEY" = "YOUR_PEXELS_API_KEY" ]; then
  echo "Please set PEXELS_API_KEY env var"
  exit 1
fi

# Random categories
CATEGORIES=(
  "nature" "city" "animals" "people" "technology" "food" "travel" 
  "architecture" "business" "sports" "music" "art" "ocean" "mountains"
  "forest" "sunset" "abstract" "minimalist" "urban" "landscape"
)

# Image sizes available in Pexels API
SIZES=("original" "large" "large2x" "medium" "small" "portrait" "landscape" "tiny")

# Device-specific dimensions (width x height)
# Tablet sizes (landscape and portrait)
TABLET_LANDSCAPE_W=1024
TABLET_LANDSCAPE_H=768
TABLET_PORTRAIT_W=768
TABLET_PORTRAIT_H=1024

# Mobile portrait sizes
MOBILE_PORTRAIT_W=390
MOBILE_PORTRAIT_H=844

# Device types to download
DEVICE_TYPES=("tablet_landscape" "tablet_portrait" "mobile_portrait")

# Configuration
NUM_PHOTOS=${1:-10}  # Number of photos to download (default: 10)
DEST_DIR="pexels_images"
mkdir -p "$DEST_DIR"

# Function to get random element from array
random_element() {
  local arr=("$@")
  echo "${arr[$RANDOM % ${#arr[@]}]}"
}

# Function to get dimensions for device type
get_device_dimensions() {
  local device_type="$1"
  case "$device_type" in
    "tablet_landscape")
      echo "${TABLET_LANDSCAPE_W} ${TABLET_LANDSCAPE_H}"
      ;;
    "tablet_portrait")
      echo "${TABLET_PORTRAIT_W} ${TABLET_PORTRAIT_H}"
      ;;
    "mobile_portrait")
      echo "${MOBILE_PORTRAIT_W} ${MOBILE_PORTRAIT_H}"
      ;;
  esac
}

# Function to download a random photo for a specific device type
download_random_photo() {
  # Pick random category
  QUERY=$(random_element "${CATEGORIES[@]}")

  # Pick random device type
  DEVICE_TYPE=$(random_element "${DEVICE_TYPES[@]}")

  # Get dimensions for device type
  read -r WIDTH HEIGHT <<< "$(get_device_dimensions "$DEVICE_TYPE")"

  # Get a random page to increase variety
  PAGE=$((RANDOM % 10 + 1))

  # Determine orientation for search
  if [ "$WIDTH" -gt "$HEIGHT" ]; then
    ORIENTATION="landscape"
  else
    ORIENTATION="portrait"
  fi

  echo "Searching for: $QUERY (${DEVICE_TYPE}: ${WIDTH}x${HEIGHT}, orientation: $ORIENTATION)"

  # Call Pexels API with orientation filter
  response=$(curl -s \
    -H "Authorization: $API_KEY" \
    "https://api.pexels.com/v1/search?query=${QUERY}&per_page=1&page=${PAGE}&orientation=${ORIENTATION}")

  # Check if response is valid and has photos
  if ! echo "$response" | jq -e '.photos' > /dev/null 2>&1; then
    echo "  Error: Invalid API response for query: $QUERY"
    return 1
  fi

  # Check if photos array exists and is not empty
  photo_count=$(echo "$response" | jq '.photos | length')
  if [ "$photo_count" -eq 0 ]; then
    echo "  No photos found for query: $QUERY"
    return 1
  fi

  # Get the original photo URL and resize using Pexels resize parameters
  original_url=$(echo "$response" | jq -r ".photos[0].src.original")

  if [ -n "$original_url" ] && [ "$original_url" != "null" ]; then
    # Pexels allows resizing via URL parameters: ?w=WIDTH&h=HEIGHT&fit=crop
    resized_url="${original_url}?w=${WIDTH}&h=${HEIGHT}&fit=crop"

    # Create unique filename with device type info
    filename="${DEST_DIR}/${QUERY}_${DEVICE_TYPE}_${WIDTH}x${HEIGHT}_${RANDOM}.jpg"

    curl -sL "$resized_url" -o "$filename"
    if [ $? -eq 0 ]; then
      echo "  ✓ Downloaded: $filename"
      return 0
    else
      echo "  ✗ Failed to download: $resized_url"
      return 1
    fi
  else
    echo "  ✗ No valid URL found"
    return 1
  fi
}

# Download random photos
echo "Downloading $NUM_PHOTOS random photos for tablet and mobile portrait sizes..."
echo "Device types: tablet_landscape (${TABLET_LANDSCAPE_W}x${TABLET_LANDSCAPE_H}), tablet_portrait (${TABLET_PORTRAIT_W}x${TABLET_PORTRAIT_H}), mobile_portrait (${MOBILE_PORTRAIT_W}x${MOBILE_PORTRAIT_H})"
echo ""

success=0
attempts=0
max_attempts=$((NUM_PHOTOS * 3))  # Allow some retries for failed downloads

while [ $success -lt $NUM_PHOTOS ] && [ $attempts -lt $max_attempts ]; do
  attempts=$((attempts + 1))
  if download_random_photo; then
    success=$((success + 1))
  fi
  # Small delay to avoid rate limiting
  sleep 0.5
done

echo ""
echo "Downloaded $success out of $NUM_PHOTOS requested photos."