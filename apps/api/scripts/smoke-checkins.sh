#!/usr/bin/env bash
# Curl checks for check-ins, selfies, state and the dev seed.
# Needs `pnpm dev` and the iron-mongo container running.
# Run: bash apps/api/scripts/smoke-checkins.sh
set -u

API="${API:-http://localhost:4000/api}"
UPLOADS="$(cd "$(dirname "$0")/.." && pwd)/uploads"
TAG="smoke-$RANDOM$RANDOM"
WORK="$(mktemp -d)"
FAILS=0
USER_A=""
USER_B=""

cleanup() {
  docker exec iron-mongo mongosh --quiet iron-coach --eval "
    const ids = db.users.find({ email: /^$TAG/ }).map((u) => u._id).toArray();
    db.checkins.deleteMany({ userId: { \$in: ids } });
    db.users.deleteMany({ _id: { \$in: ids } });" >/dev/null
  for id in "$USER_A" "$USER_B"; do
    case "$id" in
      [0-9a-f][0-9a-f]*) [ "${#id}" -eq 24 ] && rm -rf "${UPLOADS:?}/$id" ;;
    esac
  done
  rmdir "$UPLOADS" 2>/dev/null
  cd / && rm -rf "$WORK"
}
trap cleanup EXIT

. "$(dirname "$0")/lib.sh"

# assert <label> <command...>
assert() {
  local label="$1"
  shift
  if "$@"; then
    printf 'PASS %s\n' "$label"
  else
    printf 'FAIL %s\n' "$label"
    FAILS=$((FAILS + 1))
  fi
}

json_id() { grep -o '"id":"[0-9a-f]\{24\}"' "$WORK/body" | head -1 | cut -d'"' -f4; }

A="$WORK/a.jar"
B="$WORK/b.jar"
NOBODY="$WORK/nobody.jar"
PNG="$WORK/selfie.png"
TEXT="$WORK/not-an-image.jpg"
cd "$WORK" || exit 1 # relative upload paths: Git Bash mangles absolute ones containing ";"
HUGE="$WORK/huge.png"
JSON='Content-Type: application/json'
MONTH="$(TZ=Asia/Dhaka date +%Y-%m)"
printf 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' | base64 -d >"$PNG"
echo "just some text" >"$TEXT"
{ cat "$PNG"; head -c 6000000 /dev/zero; } >"$HUGE"

check "logged out, check-in refused" 401 "" "$NOBODY" -X POST -F muscles=chest -F "selfie=@$PNG" "$API/checkins"

check "register user A" 201 "" "$A" -H "$JSON" -d "{\"name\":\"Ayla\",\"email\":\"$TAG-a@example.com\",\"password\":\"correct-horse-a\"}" "$API/auth/register"
USER_A="$(json_id)"
check "register user B" 201 "" "$B" -H "$JSON" -d "{\"name\":\"Bilal\",\"email\":\"$TAG-b@example.com\",\"password\":\"correct-horse-b\"}" "$API/auth/register"
USER_B="$(json_id)"

check "new user state"                200 '"roastLevel":"rest"' "$A" "$API/state"
check "no selfie"                     400 "selfie is required"  "$A" -X POST -F muscles=chest "$API/checkins"
check "no muscles"                    400 "muscles"             "$A" -X POST -F "selfie=@$PNG" "$API/checkins"
check "unknown muscle"                400 "muscles"             "$A" -X POST -F muscles=glutes -F "selfie=@$PNG" "$API/checkins"
check "text file posing as a JPEG"    400 "JPEG, PNG or WebP"   "$A" -X POST -F muscles=chest -F "selfie=@./not-an-image.jpg;type=image/jpeg" "$API/checkins"
check "6 MB file"                     400 "too large"           "$A" -X POST -F muscles=chest -F "selfie=@$HUGE" "$API/checkins"
check "wrong file field"              400 "Unexpected file"     "$A" -X POST -F muscles=chest -F "photo=@$PNG" "$API/checkins"

check "check in, two muscles"         201 '"muscles":["chest","arms"]' "$A" -X POST -F muscles=chest -F muscles=arms -F "selfie=@$PNG" "$API/checkins"
CHECKIN="$(json_id)"
assert "response hides selfiePath" sh -c "! grep -q selfiePath '$WORK/body'"
check "second check-in today"         409 "Already checked in"  "$A" -X POST -F muscles=legs -F "selfie=@$PNG" "$API/checkins"
assert "refused uploads left no file" test "$(find "$UPLOADS/$USER_A" -type f | wc -l)" -eq 1

check "state after check-in"          200 '"roastLevel":"hype"' "$A" "$API/state"
assert "muscles grew" grep -qF '"chest":26,"back":21,"shoulders":21,"arms":26' "$WORK/body"
assert "roast filled in" sh -c "! grep -qF '{' <<'EOF'
$(grep -o '"roast":.*' "$WORK/body")
EOF"

check "calendar this month"           200 "$CHECKIN"            "$A" "$API/checkins?month=$MONTH"
check "calendar bad month"            400 "like 2026-03"        "$A" "$API/checkins?month=2026-13"
check "calendar no month"             400 "month"               "$A" "$API/checkins"
check "user B's calendar is separate" 200 '"checkins":[]'       "$B" "$API/checkins?month=$MONTH"

check "owner fetches selfie"          200 ""                    "$A" "$API/selfies/$CHECKIN"
assert "selfie bytes match" cmp -s "$PNG" "$WORK/body"
assert "selfie is image/png" grep -qi '^content-type: image/png' "$WORK/headers"
assert "selfie is not cached" grep -qi '^cache-control: private, no-store' "$WORK/headers"
check "other user gets 404"           404 "Selfie not found"    "$B" "$API/selfies/$CHECKIN"
check "logged out gets 401"           401 ""                    "$NOBODY" "$API/selfies/$CHECKIN"
check "nonsense selfie id"            404 "Selfie not found"    "$A" "$API/selfies/not-an-id"
check "path tricks in selfie id"      404 ""                    "$A" --path-as-is "$API/selfies/..%2f..%2f.env"

# Default goal is 3, so 2 rest days are allowed. Check-in on March 1, chest only.
SEED='{"dates":["2026-03-01"],"muscles":["chest"],"reset":true}'
check "seed resets check-ins"         201 '"created":1'         "$A" -H "$JSON" -d "$SEED" "$API/dev/seed"
check "seed same date again"          409 "already checked in"  "$A" -H "$JSON" -d '{"dates":["2026-03-01"],"muscles":["chest"]}' "$API/dev/seed"
check "seed bad date"                 400 "dates"               "$A" -H "$JSON" -d '{"dates":["2026-02-30"],"muscles":["chest"]}' "$API/dev/seed"
check "today=Mar 1, checked in"       200 '"roastLevel":"hype"'    "$A" "$API/state?today=2026-03-01"
check "today=Mar 4, allowed rest"     200 '"roastLevel":"rest"'    "$A" "$API/state?today=2026-03-04"
check "today=Mar 5, 1 skip day"       200 '"roastLevel":"annoyed"' "$A" "$API/state?today=2026-03-05"
check "today=Mar 6, 2 skip days"      200 '"roastLevel":"angry"'   "$A" "$API/state?today=2026-03-06"
check "today=Mar 8, 4 skip days"      200 '"chest":18,"back":13'   "$A" "$API/state?today=2026-03-08"
assert "4 skip days is savage" grep -qF '"roastLevel":"savage"' "$WORK/body"
check "today=Mar 12, 8 skip days"     200 '"roastLevel":"nuclear"' "$A" "$API/state?today=2026-03-12"
check "today before any check-in"     200 '"chest":20'             "$A" "$API/state?today=2026-02-01"
check "bad fake date"                 400 "today"                  "$A" "$API/state?today=soon"

check "seed a comeback"               201 '"created":2'         "$A" -H "$JSON" -d '{"dates":["2026-03-01","2026-03-08"],"muscles":["legs"],"reset":true}' "$API/dev/seed"
check "first check-in after skipping" 200 '"roastLevel":"comeback"' "$A" "$API/state?today=2026-03-08"

check "seeded calendar"               200 '"date":"2026-03-08"' "$A" "$API/checkins?month=2026-03"
SEEDED="$(json_id)"
check "seeded selfie fetches"         200 ""                    "$A" "$API/selfies/$SEEDED"

echo
if [ "$FAILS" -eq 0 ]; then echo "All checks passed."; else echo "$FAILS check(s) failed."; exit 1; fi
