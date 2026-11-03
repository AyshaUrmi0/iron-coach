#!/usr/bin/env bash
# Curl checks for demo accounts: creating, using, signing up from, and expiring them.
# Needs `pnpm dev` and the iron-mongo container running.
# Run: bash apps/api/scripts/smoke-demo.sh
set -u

API="${API:-http://localhost:4000/api}"
UPLOADS="$(cd "$(dirname "$0")/.." && pwd)/uploads"
TAG="smoke-$RANDOM$RANDOM"
WORK="$(mktemp -d)"
FAILS=0
CREATED_IDS=""

mongo() { docker exec iron-mongo mongosh --quiet iron-coach --eval "$1"; }

cleanup() {
  for id in $CREATED_IDS; do
    mongo "db.checkins.deleteMany({ userId: ObjectId('$id') }); db.roasts.deleteOne({ userId: ObjectId('$id') }); db.users.deleteOne({ _id: ObjectId('$id') });" >/dev/null
    rm -rf "${UPLOADS:?}/$id"
  done
  rmdir "$UPLOADS" 2>/dev/null
  cd / && rm -rf "$WORK"
}
trap cleanup EXIT

. "$(dirname "$0")/lib.sh"

# same <label> <actual> <expected>
same() {
  if [ "$2" = "$3" ]; then
    printf 'PASS %s (%s)\n' "$1" "$2"
  else
    printf 'FAIL %s: got %s, expected %s\n' "$1" "$2" "$3"
    FAILS=$((FAILS + 1))
  fi
}

remember_id() {
  LAST_ID="$(grep -o '"id":"[0-9a-f]\{24\}"' "$WORK/body" | head -1 | cut -d'"' -f4)"
  CREATED_IDS="$CREATED_IDS $LAST_ID"
}
demo_email() { mongo "db.users.findOne({ _id: ObjectId('$1') }).email"; }
sample_count() { mongo "db.checkins.countDocuments({ userId: ObjectId('$1'), isSample: true })"; }
checkin_count() { mongo "db.checkins.countDocuments({ userId: ObjectId('$1') })"; }

cd "$WORK" || exit 1
JSON='Content-Type: application/json'
PASSWORD="correct-horse-demo"
# A real 1x1 PNG with extra bytes on the end, so it can't be mistaken for the placeholder.
printf 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' | base64 -d >selfie.png
printf 'extra' >>selfie.png

check "start a demo, no login"            201 '"isDemo":true' demo.jar -X POST "$API/auth/demo"
remember_id; DEMO="$LAST_ID"
same "cookie is HttpOnly" "$(grep -ic '^set-cookie: token=.*httponly' headers)" 1
check "second visitor gets a separate demo" 201 '"isDemo":true' other.jar -X POST "$API/auth/demo"
remember_id; OTHER="$LAST_ID"
[ "$DEMO" != "$OTHER" ]; same "demos are separate accounts" "$?" 0

check "sample history gives an angry coach" 200 '"roastLevel":"angry"' demo.jar "$API/state"
same "demo starts with 4 sample check-ins" "$(sample_count "$DEMO")" 4
check "demo login with no password works"   401 "Wrong email"  demo.jar -H "$JSON" -d "{\"email\":\"$(demo_email "$DEMO")\",\"password\":\"!demo-account-has-no-password\"}" "$API/auth/login"

check "demo can change settings"            200 '"weeklyGoal":3' demo.jar -X PATCH -H "$JSON" -d '{"bodyType":"female"}' "$API/me"
check "demo check-in"                       201 '"muscles":["legs"]' demo.jar -X POST -F muscles=legs -F "selfie=@selfie.png" "$API/checkins"
CHECKIN="$(grep -o '"id":"[0-9a-f]\{24\}"' body | head -1 | cut -d'"' -f4)"
check "comeback after the sample skip days" 200 '"roastLevel":"comeback"' demo.jar "$API/state"
[ ! -e "$UPLOADS/$DEMO" ]; same "demo photo was not stored" "$?" 0
check "demo selfie is the placeholder"      200 "" demo.jar "$API/selfies/$CHECKIN"
cmp -s selfie.png body; same "uploaded photo is not served back" "$?" 1
check "other visitor can't see it"          404 "Selfie not found" other.jar "$API/selfies/$CHECKIN"

check "real account for the next tests"     201 '"isDemo":false' real.jar -H "$JSON" -d "{\"name\":\"Real\",\"email\":\"$TAG-real@example.com\",\"password\":\"$PASSWORD\"}" "$API/auth/register"
remember_id; REAL="$LAST_ID"
check "sign-up with a taken email"          409 "already registered" demo.jar -H "$JSON" -d "{\"name\":\"Twin\",\"email\":\"$TAG-real@example.com\",\"password\":\"$PASSWORD\"}" "$API/auth/register"
check "still a demo after that"             200 '"isDemo":true' demo.jar "$API/me"

check "sign up keeps the same account"      201 "\"id\":\"$DEMO\"" demo.jar -H "$JSON" -d "{\"name\":\"Kept\",\"email\":\"$TAG-kept@example.com\",\"password\":\"$PASSWORD\"}" "$API/auth/register"
check "account is real now"                 200 '"isDemo":false' demo.jar "$API/me"
same "sample check-ins removed" "$(sample_count "$DEMO")" 0
same "visitor's own check-in kept" "$(checkin_count "$DEMO")" 1
check "settings kept"                       200 '"bodyType":"female"' demo.jar "$API/me"
check "real check-in stays on today"        200 '"checkedInToday":true' demo.jar "$API/state"
check "logs in with the new password"       200 "\"id\":\"$DEMO\"" fresh.jar -H "$JSON" -d "{\"email\":\"$TAG-kept@example.com\",\"password\":\"$PASSWORD\"}" "$API/auth/login"
check "still one check-in per day"          409 "Already checked in" demo.jar -X POST -F muscles=legs -F "selfie=@selfie.png" "$API/checkins"

check "sweep leaves unexpired demos alone"  200 '"deleted":' real.jar -X POST "$API/dev/sweep-demos"
check "unexpired demo still works"          200 '"isDemo":true' other.jar "$API/me"
mongo "db.users.updateOne({ _id: ObjectId('$OTHER') }, { \$set: { demoExpiresAt: new Date(0) } })" >/dev/null
# A real account with an old date must survive, in case a bad value ever slips in.
mongo "db.users.updateOne({ _id: ObjectId('$REAL') }, { \$set: { demoExpiresAt: new Date(0) } })" >/dev/null
check "sweep deletes the expired demo"      200 '"deleted":' real.jar -X POST "$API/dev/sweep-demos"
check "expired demo is logged out"          401 "Log in first" other.jar "$API/me"
same "expired demo's check-ins are gone" "$(checkin_count "$OTHER")" 0
check "real account survives the sweep"     200 '"isDemo":false' real.jar "$API/me"
check "upgraded account survives the sweep" 200 '"isDemo":false' demo.jar "$API/me"

echo
if [ "$FAILS" -eq 0 ]; then echo "All checks passed."; else echo "$FAILS check(s) failed."; exit 1; fi
