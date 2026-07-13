#!/usr/bin/env bash
#
# Post-deploy smoke suite for the FAD/ARC API. Read-only against seeded data
# except for one throwaway auth account (unique-suffixed email per run) and one
# idempotent follow round-trip that unfollows itself. Depends only on curl + jq
# (no runtime deps) so it runs anywhere the deploy runbook does
# (docs/delivery-plan.md -> Test deployment runbook; cdk/README.md).
#
# Usage:
#   scripts/smoke-test.sh <base-url>
#   scripts/smoke-test.sh https://test.athletearc.ca
#   scripts/smoke-test.sh http://localhost:4000
#
# Exit code: 0 when every check passes, 1 if any check fails.

set -uo pipefail

BASE_URL="${1:-}"
if [[ -z "${BASE_URL}" ]]; then
  echo "usage: $0 <base-url>   (e.g. https://test.athletearc.ca)" >&2
  exit 2
fi
BASE_URL="${BASE_URL%/}"

if ! command -v jq >/dev/null 2>&1; then
  echo "smoke-test requires 'jq' on PATH" >&2
  exit 2
fi

SEEDED_SLUG="maya-okafor"
CURL_MAX_TIME=30

PASS_COUNT=0
FAIL_COUNT=0
declare -a RESULT_NAMES=()
declare -a RESULT_STATUSES=()

record() {
  local name="$1" status="$2" detail="${3:-}"
  RESULT_NAMES+=("${name}")
  RESULT_STATUSES+=("${status}")
  if [[ "${status}" == "PASS" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    printf '  [PASS] %s\n' "${name}"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    printf '  [FAIL] %s -- %s\n' "${name}" "${detail}"
  fi
}

# request METHOD PATH [BODY] [BEARER]
# Emits "<body>\n<http_status>"; callers split with http_body/http_status.
# Body and bearer are passed via argv (never interpolated into a shell string)
# so response content can never influence a later command.
request() {
  local method="$1" path="$2" body="${3:-}" bearer="${4:-}"
  local -a args=(-sS -m "${CURL_MAX_TIME}" -o - -w $'\n%{http_code}' -X "${method}")
  args+=(-H 'Accept: application/json')
  if [[ -n "${bearer}" ]]; then
    args+=(-H "Authorization: Bearer ${bearer}")
  fi
  if [[ -n "${body}" ]]; then
    args+=(-H 'Content-Type: application/json' --data "${body}")
  fi
  curl "${args[@]}" "${BASE_URL}${path}" 2>/dev/null
}

http_status() { printf '%s' "$1" | tail -n1; }
http_body() { printf '%s' "$1" | sed '$d'; }

# --- health -----------------------------------------------------------------

check_health() {
  local endpoint="$1" label="$2"
  local resp status
  resp="$(request GET "${endpoint}")"
  status="$(http_status "${resp}")"
  if [[ "${status}" == "200" ]]; then
    record "${label} (${endpoint} 200)" PASS
  else
    record "${label} (${endpoint} 200)" FAIL "got HTTP ${status}"
  fi
}

# --- directory (filter + cursor page) ---------------------------------------

check_directory() {
  local resp status body item_count next_cursor off_level
  resp="$(request GET "/v1/athletes?runnerLevel=ELITE&limit=2")"
  status="$(http_status "${resp}")"
  body="$(http_body "${resp}")"
  if [[ "${status}" != "200" ]]; then
    record "directory (?runnerLevel=ELITE)" FAIL "got HTTP ${status}"
    return
  fi
  item_count="$(printf '%s' "${body}" | jq -r '.data.items | length' 2>/dev/null)"
  if [[ -z "${item_count}" || "${item_count}" == "null" || "${item_count}" -lt 1 ]]; then
    record "directory (?runnerLevel=ELITE)" FAIL "expected >=1 item, got '${item_count}'"
    return
  fi
  # Every returned athlete must actually match the ELITE filter.
  off_level="$(printf '%s' "${body}" \
    | jq -r '[.data.items[] | select(.runnerLevel != "ELITE")] | length' 2>/dev/null)"
  if [[ "${off_level}" != "0" ]]; then
    record "directory (?runnerLevel=ELITE)" FAIL "filter leaked ${off_level} non-ELITE item(s)"
    return
  fi
  record "directory (?runnerLevel=ELITE returns ${item_count} item(s))" PASS

  next_cursor="$(printf '%s' "${body}" | jq -r '.data.nextCursor // empty' 2>/dev/null)"
  if [[ -z "${next_cursor}" ]]; then
    record "directory cursor page (single page, nextCursor null)" PASS
    return
  fi
  local page2 p2_status p2_count
  page2="$(request GET "/v1/athletes?runnerLevel=ELITE&limit=2&cursor=${next_cursor}")"
  p2_status="$(http_status "${page2}")"
  if [[ "${p2_status}" != "200" ]]; then
    record "directory cursor page" FAIL "page 2 got HTTP ${p2_status}"
    return
  fi
  p2_count="$(http_body "${page2}" | jq -r '.data.items | length' 2>/dev/null)"
  if [[ -z "${p2_count}" || "${p2_count}" == "null" ]]; then
    record "directory cursor page" FAIL "page 2 body missing data.items"
    return
  fi
  record "directory cursor page (walked one page, ${p2_count} item(s))" PASS
}

# --- profile by seeded slug (rich fields present) ---------------------------

check_profile() {
  local resp status body slug missing
  resp="$(request GET "/v1/athletes/${SEEDED_SLUG}")"
  status="$(http_status "${resp}")"
  body="$(http_body "${resp}")"
  if [[ "${status}" != "200" ]]; then
    record "profile /${SEEDED_SLUG}" FAIL "got HTTP ${status}"
    return
  fi
  slug="$(printf '%s' "${body}" | jq -r '.data.athleteSlug // empty' 2>/dev/null)"
  if [[ "${slug}" != "${SEEDED_SLUG}" ]]; then
    record "profile /${SEEDED_SLUG}" FAIL "athleteSlug mismatch ('${slug}')"
    return
  fi
  # Rich fields the nate profile page renders must be present and populated.
  missing="$(printf '%s' "${body}" | jq -r '
    [
      (if (.data.personalBests   | type) == "array" and (.data.personalBests   | length) > 0 then empty else "personalBests"   end),
      (if (.data.raceResults     | type) == "array" and (.data.raceResults     | length) > 0 then empty else "raceResults"     end),
      (if (.data.roadmap         | type) == "array" and (.data.roadmap         | length) > 0 then empty else "roadmap"         end),
      (if (.data.storyBody       | type) == "array" and (.data.storyBody       | length) > 0 then empty else "storyBody"       end),
      (if (.data.accomplishments | type) == "array" and (.data.accomplishments | length) > 0 then empty else "accomplishments" end),
      (if (.data.presentation    | type) == "object" then empty else "presentation" end),
      (if (.data.runnerLevel     | type) == "string" then empty else "runnerLevel" end)
    ] | join(",")
  ' 2>/dev/null)"
  if [[ -n "${missing}" ]]; then
    record "profile /${SEEDED_SLUG} rich fields" FAIL "empty/absent: ${missing}"
    return
  fi
  record "profile /${SEEDED_SLUG} (rich fields present)" PASS
}

# --- community feed ---------------------------------------------------------

check_community_feed() {
  local resp status count
  resp="$(request GET "/v1/community/feed?limit=5")"
  status="$(http_status "${resp}")"
  if [[ "${status}" != "200" ]]; then
    record "community feed" FAIL "got HTTP ${status}"
    return
  fi
  count="$(http_body "${resp}" | jq -r '.data.items | length' 2>/dev/null)"
  if [[ -z "${count}" || "${count}" == "null" || "${count}" -lt 1 ]]; then
    record "community feed" FAIL "expected >=1 item, got '${count}'"
    return
  fi
  record "community feed (${count} item(s))" PASS
}

# --- campaigns feed ---------------------------------------------------------

check_campaign_feed() {
  local resp status count
  resp="$(request GET "/v1/campaigns?limit=5")"
  status="$(http_status "${resp}")"
  if [[ "${status}" != "200" ]]; then
    record "campaigns feed" FAIL "got HTTP ${status}"
    return
  fi
  count="$(http_body "${resp}" | jq -r '.data.items | length' 2>/dev/null)"
  if [[ -z "${count}" || "${count}" == "null" ]]; then
    record "campaigns feed" FAIL "body missing data.items"
    return
  fi
  record "campaigns feed (${count} item(s))" PASS
}

# --- auth round-trip + follow round-trip ------------------------------------
# Populated by check_auth so check_follow can reuse the throwaway account.
ACCESS_TOKEN=""

check_auth() {
  local suffix email password body resp status token me_email
  suffix="$(date +%s)-${RANDOM}"
  email="smoke-${suffix}@smoke.athletearc.ca"
  password="ArcSmoke!Passw0rd"

  body="$(jq -nc --arg email "${email}" --arg password "${password}" \
    '{email:$email, password:$password, displayName:"Smoke Test"}')"
  resp="$(request POST "/v1/auth/sign-up" "${body}")"
  status="$(http_status "${resp}")"
  if [[ "${status}" != "201" ]]; then
    record "auth sign-up" FAIL "got HTTP ${status}"
    return
  fi
  record "auth sign-up (201)" PASS

  body="$(jq -nc --arg email "${email}" --arg password "${password}" \
    '{email:$email, password:$password}')"
  resp="$(request POST "/v1/auth/sign-in" "${body}")"
  status="$(http_status "${resp}")"
  if [[ "${status}" != "200" ]]; then
    record "auth sign-in" FAIL "got HTTP ${status}"
    return
  fi
  token="$(http_body "${resp}" | jq -r '.data.accessToken // empty' 2>/dev/null)"
  if [[ -z "${token}" ]]; then
    record "auth sign-in" FAIL "no accessToken in response"
    return
  fi
  ACCESS_TOKEN="${token}"
  record "auth sign-in (accessToken issued)" PASS

  resp="$(request GET "/v1/users/me" "" "${ACCESS_TOKEN}")"
  status="$(http_status "${resp}")"
  if [[ "${status}" != "200" ]]; then
    record "auth GET /v1/users/me" FAIL "got HTTP ${status}"
    return
  fi
  me_email="$(http_body "${resp}" | jq -r '.data.email // empty' 2>/dev/null)"
  if [[ "${me_email}" != "${email}" ]]; then
    record "auth GET /v1/users/me" FAIL "email mismatch ('${me_email}' != '${email}')"
    return
  fi
  record "auth GET /v1/users/me (email matches)" PASS
}

check_follow() {
  if [[ -z "${ACCESS_TOKEN}" ]]; then
    record "follow round-trip" FAIL "no access token (auth check did not complete)"
    return
  fi
  local resp status contains
  resp="$(request POST "/v1/athletes/${SEEDED_SLUG}/follow" "" "${ACCESS_TOKEN}")"
  status="$(http_status "${resp}")"
  if [[ "${status}" != "200" && "${status}" != "201" && "${status}" != "204" ]]; then
    record "follow ${SEEDED_SLUG}" FAIL "got HTTP ${status}"
    return
  fi
  record "follow ${SEEDED_SLUG} (${status})" PASS

  resp="$(request GET "/v1/users/me/follows" "" "${ACCESS_TOKEN}")"
  status="$(http_status "${resp}")"
  if [[ "${status}" != "200" ]]; then
    record "follow list" FAIL "GET /v1/users/me/follows got HTTP ${status}"
    return
  fi
  contains="$(http_body "${resp}" \
    | jq -r --arg slug "${SEEDED_SLUG}" \
        '[.data.items[]? | select(.athleteSlug == $slug)] | length' 2>/dev/null)"
  if [[ "${contains}" != "1" ]]; then
    record "follow list contains ${SEEDED_SLUG}" FAIL "found ${contains} match(es)"
    return
  fi
  record "follow list contains ${SEEDED_SLUG}" PASS

  resp="$(request DELETE "/v1/athletes/${SEEDED_SLUG}/follow" "" "${ACCESS_TOKEN}")"
  status="$(http_status "${resp}")"
  if [[ "${status}" != "200" && "${status}" != "204" ]]; then
    record "unfollow ${SEEDED_SLUG}" FAIL "got HTTP ${status}"
    return
  fi
  record "unfollow ${SEEDED_SLUG} (${status})" PASS
}

# --- run --------------------------------------------------------------------

printf 'ARC smoke suite -> %s\n\n' "${BASE_URL}"

check_health "/v1/health/live" "health live"
check_health "/v1/health/ready" "health ready"
check_directory
check_profile
check_community_feed
check_campaign_feed
check_auth
check_follow

# --- summary table ----------------------------------------------------------

printf '\n%s\n' "-------------------------------------------------------------"
printf '%-8s %s\n' "RESULT" "CHECK"
printf '%s\n' "-------------------------------------------------------------"
for i in "${!RESULT_NAMES[@]}"; do
  printf '%-8s %s\n' "${RESULT_STATUSES[$i]}" "${RESULT_NAMES[$i]}"
done
printf '%s\n' "-------------------------------------------------------------"
printf '%d passed, %d failed, %d total\n' \
  "${PASS_COUNT}" "${FAIL_COUNT}" "$((PASS_COUNT + FAIL_COUNT))"

if [[ "${FAIL_COUNT}" -gt 0 ]]; then
  exit 1
fi
exit 0
