# Shared by the curl check scripts. Needs FAILS and WORK set first.

# check <label> <expected status> <text the body must contain, or ""> <jar> <curl args...>
check() {
  local label="$1" expected="$2" want="$3" jar="$4"
  shift 4
  local status result="PASS"
  status="$(curl -s -b "$jar" -c "$jar" -D "$WORK/headers" -o "$WORK/body" -w '%{http_code}' "$@")"
  if [ "$status" != "$expected" ]; then result="FAIL"; FAILS=$((FAILS + 1)); fi
  if [ -n "$want" ] && ! grep -qF -- "$want" "$WORK/body"; then
    result="FAIL (no: $want)"
    FAILS=$((FAILS + 1))
  fi
  printf '%-4s %-38s %s %s\n' "$result" "$label" "$status" "$(head -c 200 "$WORK/body" | tr -cd '[:print:]')"
}
