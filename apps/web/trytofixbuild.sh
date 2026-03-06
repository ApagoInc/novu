#  RUN THIS when the containers have first been successfully built and spun up.

# TODO - Add this as a treatment step in the Dockerfile, maybe?


#!/bin/sh
set -e

DIST="/usr/src/app/packages/notification-center/dist"

echo "- before script run -"
echo "Macro references found:"
grep -rl "emotion/styled/macro\|emotion/react/macro\|emotion/css/macro" "$DIST" | wc -l
echo "files."
echo ""

find "$DIST" -type f -name "*.js" -exec sed -i 's|@emotion/styled/macro|@emotion/styled|g' {} +
find "$DIST" -type f -name "*.js" -exec sed -i 's|@emotion/react/macro|@emotion/react|g' {} +
find "$DIST" -type f -name "*.js" -exec sed -i 's|@emotion/css/macro|@emotion/css|g' {} +

echo "- after script run -"
echo "Macro references remaining:"
REMAINING=$(grep -rl "emotion/styled/macro\|emotion/react/macro\|emotion/css/macro" "$DIST" 2>/dev/null | wc -l)
echo "$REMAINING files."
echo ""

if [ "$REMAINING" -eq 0 ]; then
    echo "DONE. All macro references killed. Restart dev server now."
else
    echo "WARNING: Some references survived. Check manually."
fi
