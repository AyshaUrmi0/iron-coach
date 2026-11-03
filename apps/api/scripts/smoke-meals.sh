#!/usr/bin/env bash
# Curl checks for meals, saved foods and the protein goal.
# Needs `pnpm dev` and the iron-mongo container running.
# Run: bash apps/api/scripts/smoke-meals.sh
set -u

API="${API:-http://localhost:4000/api}"
TAG="smoke-$RANDOM$RANDOM"
WORK="$(mktemp -d)"
FAILS=0

cleanup() {
  docker exec iron-mongo mongosh --quiet iron-coach --eval "
    const ids = db.users.find({ email: /^$TAG/ }).map((u) => u._id).toArray();
    db.meals.deleteMany({ userId: { \$in: ids } });
    db.roasts.deleteMany({ userId: { \$in: ids } });
    db.users.deleteMany({ _id: { \$in: ids } });" >/dev/null
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

json_id() { grep -o '"id":"[0-9a-f]\{24\}"' "$WORK/body" | head -1 | cut -d'"' -f4; }
name_count() { grep -o '"name":' "$WORK/body" | wc -l | tr -d ' '; }

A="$WORK/a.jar"
B="$WORK/b.jar"
NOBODY="$WORK/nobody.jar"
JSON='Content-Type: application/json'
MONTH="$(TZ=Asia/Dhaka date +%Y-%m)"

check "logged out, list refused"      401 "" "$NOBODY" "$API/meals?month=$MONTH"
check "logged out, log refused"       401 "" "$NOBODY" -H "$JSON" -d '{"name":"Eggs","protein":12}' "$API/meals"

check "register user A" 201 "" "$A" -H "$JSON" -d "{\"name\":\"Ayla\",\"email\":\"$TAG-a@example.com\",\"password\":\"correct-horse-a\"}" "$API/auth/register"
check "register user B" 201 "" "$B" -H "$JSON" -d "{\"name\":\"Bilal\",\"email\":\"$TAG-b@example.com\",\"password\":\"correct-horse-b\"}" "$API/auth/register"

check "default protein goal"          200 '"proteinGoal":100'   "$A" "$API/me"
check "change protein goal"           200 '"proteinGoal":150'   "$A" -X PATCH -H "$JSON" -d '{"proteinGoal":150}' "$API/me"
check "goal too low"                  400 "proteinGoal"         "$A" -X PATCH -H "$JSON" -d '{"proteinGoal":19}' "$API/me"
check "goal too high"                 400 "proteinGoal"         "$A" -X PATCH -H "$JSON" -d '{"proteinGoal":501}' "$API/me"
check "goal not a whole number"       400 "proteinGoal"         "$A" -X PATCH -H "$JSON" -d '{"proteinGoal":100.5}' "$API/me"

check "no meals yet"                  200 '"meals":[]'          "$A" "$API/meals?month=$MONTH"
check "no saved foods yet"            200 '"foods":[]'          "$A" "$API/meals/foods"
check "bad month"                     400 "month"               "$A" "$API/meals?month=soon"
check "no month"                      400 "month"               "$A" "$API/meals"
check "blank name"                    400 "name"                "$A" -H "$JSON" -d '{"name":"   ","protein":12}' "$API/meals"
check "name too long"                 400 "name"                "$A" -H "$JSON" -d "{\"name\":\"$(printf 'x%.0s' $(seq 61))\",\"protein\":12}" "$API/meals"
check "negative protein"              400 "protein"             "$A" -H "$JSON" -d '{"name":"Eggs","protein":-1}' "$API/meals"
check "too much protein"              400 "protein"             "$A" -H "$JSON" -d '{"name":"Eggs","protein":301}' "$API/meals"
check "fractional protein"            400 "protein"             "$A" -H "$JSON" -d '{"name":"Eggs","protein":12.5}' "$API/meals"
check "protein as text"               400 "protein"             "$A" -H "$JSON" -d '{"name":"Eggs","protein":"12"}' "$API/meals"
check "can't choose the date"         400 ""                    "$A" -H "$JSON" -d '{"name":"Eggs","protein":12,"date":"2020-01-01"}' "$API/meals"
check "can't choose the user"         400 ""                    "$A" -H "$JSON" -d '{"name":"Eggs","protein":12,"userId":"6aea0874f6e3a03c05ed73fe"}' "$API/meals"

check "log a meal, name trimmed"      201 '"name":"2 eggs","protein":12' "$A" -H "$JSON" -d '{"name":"  2 eggs ","protein":12}' "$API/meals"
MEAL="$(json_id)"
check "log a zero-protein meal"       201 '"protein":0'         "$A" -H "$JSON" -d '{"name":"Black coffee","protein":0}' "$API/meals"
check "meals in the month"            200 '"name":"2 eggs"'     "$A" "$API/meals?month=$MONTH"
same "two meals listed" "$(name_count)" 2
check "other month is empty"          200 '"meals":[]'          "$A" "$API/meals?month=2020-01"

check "same food, new protein"        201 '"protein":14'        "$A" -H "$JSON" -d '{"name":"2 EGGS","protein":14}' "$API/meals"
check "saved foods"                   200 '"name":"2 EGGS","protein":14' "$A" "$API/meals/foods"
same "same food saved once" "$(name_count)" 2

check "other user can't see meals"    200 '"meals":[]'          "$B" "$API/meals?month=$MONTH"
check "other user has no saved foods" 200 '"foods":[]'          "$B" "$API/meals/foods"
check "other user can't delete"       404 "Meal not found"      "$B" -X DELETE "$API/meals/$MEAL"
check "logged out can't delete"       401 ""                    "$NOBODY" -X DELETE "$API/meals/$MEAL"
check "nonsense meal id"              404 "Meal not found"      "$A" -X DELETE "$API/meals/not-an-id"
check "delete a meal"                 204 ""                    "$A" -X DELETE "$API/meals/$MEAL"
check "delete it again"               404 "Meal not found"      "$A" -X DELETE "$API/meals/$MEAL"
check "it's gone"                     200 ""                    "$A" "$API/meals?month=$MONTH"
same "two meals left" "$(name_count)" 2

for _ in $(seq 28); do
  curl -s -o /dev/null -b "$A" -H "$JSON" -d '{"name":"Snack","protein":1}' "$API/meals"
done
check "31st meal of the day refused"  409 "30 meals"            "$A" -H "$JSON" -d '{"name":"Snack","protein":1}' "$API/meals"
check "limit is per user"             201 ""                    "$B" -H "$JSON" -d '{"name":"Snack","protein":1}' "$API/meals"

echo
if [ "$FAILS" -eq 0 ]; then echo "All checks passed."; else echo "$FAILS check(s) failed."; exit 1; fi
