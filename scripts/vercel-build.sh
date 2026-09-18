#!/usr/bin/env bash
set -euo pipefail

git clone https://github.com/flutter/flutter.git -b stable --depth 1 _flutter
_flutter/bin/flutter build web --release \
  --dart-define=SUPABASE_URL="$SUPABASE_URL" \
  --dart-define=SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY" \
  --dart-define=PDF_PARSE_BASE_URL="https://$VERCEL_URL"
