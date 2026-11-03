#!/usr/bin/env bash
# Curl checks for the auth API. Needs `pnpm dev` and the iron-mongo container running.
# Run: bash apps/api/scripts/smoke-auth.sh
set -u

API="${API:-http://localhost:4000/api}"
EMAIL="smoke-$RANDOM$RANDOM@example.com"
PASSWORD="correct-horse-battery"
JAR="$(mktemp)"
BODY="$(mktemp)"
HEADERS="$(mktemp)"
FAILS=0

cleanup() {
  rm -f "$JAR" "$BODY" "$HEADERS"
  docker exec iron-mongo mongosh --quiet iron-coach \
    --eval "db.users.deleteOne({ email: '$EMAIL' })" >/dev/null
}
trap cleanup EXIT

# check <label> <expected status> <method> <path> [json body]
check() {
  local label="$1" expected="$2" method="$3" path="$4" data="${5:-}"
  local args=(-s -b "$JAR" -c "$JAR" -D "$HEADERS" -o "$BODY" -w '%{http_code}' -X "$method")
  [ -n "$data" ] && args+=(-H 'Content-Type: application/json' -d "$data")
  local status
  status="$(curl "${args[@]}" "$API$path")"
  local result="PASS"
  if [ "$status" != "$expected" ]; then result="FAIL"; FAILS=$((FAILS + 1)); fi
  if grep -q '"passwordHash":' "$BODY"; then result="FAIL (leaked passwordHash)"; FAILS=$((FAILS + 1)); fi
  printf '%-4s %-34s %s %s %s\n' "$result" "$label" "$status" "$method $path" "$(cat "$BODY")"
}

# expect_cookie_flag <flag>: the last response must set the auth cookie with this flag.
expect_cookie_flag() {
  if grep -i '^set-cookie: token=' "$HEADERS" | grep -qi "$1"; then
    printf 'PASS cookie has %s\n' "$1"
  else
    printf 'FAIL cookie missing %s\n' "$1"
    FAILS=$((FAILS + 1))
  fi
}

check "logged out, me refused"        401 GET   /me
check "bad email and short password"  400 POST  /auth/register '{"name":"Smoke","email":"nope","password":"short"}'
check "register"                      201 POST  /auth/register "{\"name\":\"Smoke\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
expect_cookie_flag HttpOnly
expect_cookie_flag SameSite=Lax
check "same email again"              409 POST  /auth/register "{\"name\":\"Twin\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
check "read me"                       200 GET   /me
check "update profile"                200 PATCH /me '{"name":"Smokey","bodyType":"female","weeklyGoal":5,"language":"en"}'
check "pick a starting body"          200 PATCH /me '{"startBody":"heavy"}'
check "unknown starting body"         400 PATCH /me '{"startBody":"giant"}'
check "goal out of range"             400 PATCH /me '{"weeklyGoal":8}'
check "unknown body type"             400 PATCH /me '{"bodyType":"alien"}'
check "language not offered"          400 PATCH /me '{"language":"fr"}'
check "email can't be patched"        400 PATCH /me '{"email":"other@example.com"}'
check "passwordHash can't be patched" 400 PATCH /me '{"passwordHash":"x"}'
check "broken JSON"                   400 PATCH /me '{"name":'
check "logout"                        204 POST  /auth/logout
check "after logout, me refused"      401 GET   /me
check "wrong password"                401 POST  /auth/login "{\"email\":\"$EMAIL\",\"password\":\"wrong-password\"}"
check "unknown email"                 401 POST  /auth/login "{\"email\":\"nobody-$EMAIL\",\"password\":\"$PASSWORD\"}"
check "NoSQL injection in email"      400 POST  /auth/login '{"email":{"$ne":null},"password":"x"}'
check "login"                         200 POST  /auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
check "read me again, edits kept"     200 GET   /me
check "unknown route"                 404 GET   /nope

TAMPERED="$(curl -s -o /dev/null -w '%{http_code}' -H 'Cookie: token=not.a.realtoken' "$API/me")"
if [ "$TAMPERED" = 401 ]; then echo "PASS tampered cookie refused 401"; else echo "FAIL tampered cookie got $TAMPERED"; FAILS=$((FAILS + 1)); fi

echo
if [ "$FAILS" -eq 0 ]; then echo "All checks passed."; else echo "$FAILS check(s) failed."; exit 1; fi
