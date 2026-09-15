#!/usr/bin/env bash
#
# Front-door route coverage for the Cloudflare Worker. Asserts every route the
# retired CloudFront Function served (cdk/lib/web-stack.ts -> STATIC_ROUTE_REWRITE_CODE)
# still resolves, plus the athlete-slug rewrites, the favicon alias, and the
# 404 fallback. API behaviour is covered separately by scripts/smoke-test.sh.
#
# Usage:
#   scripts/route-sweep.sh <base-url>
#   scripts/route-sweep.sh https://athlete-arc.<subdomain>.workers.dev
#   scripts/route-sweep.sh https://athletearc.ca
#
# Exit code: 0 when every check passes, 1 if any check fails.

set -uo pipefail

BASE_URL="${1:-}"
if [[ -z "${BASE_URL}" ]]; then
  echo "usage: $0 <base-url>   (e.g. https://athletearc.ca)" >&2
  exit 2
fi
BASE_URL="${BASE_URL%/}"

CURL_MAX_TIME=30
PASS_COUNT=0
FAIL_COUNT=0

# check PATH EXPECTED_STATUS [EXPECTED_BODY_SUBSTRING]
# A substring assertion is how we prove a rewrite served the right document
# rather than merely returning 200 from the wrong one.
check() {
  local path="$1" expected_status="$2" expected_body="${3:-}"
  local tmp status detail=""
  tmp="$(mktemp)"
  status="$(curl -sS -m "${CURL_MAX_TIME}" -o "${tmp}" -w '%{http_code}' "${BASE_URL}${path}" 2>/dev/null)"

  if [[ "${status}" != "${expected_status}" ]]; then
    detail="expected HTTP ${expected_status}, got ${status}"
  elif [[ -n "${expected_body}" ]] && ! grep -qF "${expected_body}" "${tmp}"; then
    detail="HTTP ${status} but body missing '${expected_body}'"
  fi
  rm -f "${tmp}"

  if [[ -z "${detail}" ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    printf '  [PASS] %s\n' "${path}"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    printf '  [FAIL] %s -- %s\n' "${path}" "${detail}"
  fi
}

printf 'ARC route sweep -> %s\n\n' "${BASE_URL}"

printf 'static routes\n'
check / 200
for route in /about /ambassadors /athletes /brands /community /dashboard \
             /donate/thanks /for-athletes /forgot-password /how-it-works \
             /mission /presentation /privacy /register /register/athletics \
             /register/personal-basics /register/review /register/values-social \
             /reset-password /sign-in /sign-up /support /terms /verify-email; do
  check "${route}" 200
done

# The CloudFront Function stripped a trailing slash before its route lookup;
# Workers html_handling canonicalises with a 307, so follow it and assert 200.
printf '\ntrailing-slash canonicalisation\n'
check /about/ 307
check /register/athletics/ 307

# Every athlete slug renders the shared shell, which reads the slug from the
# URL. A 307 here would strip the slug and break the profile page.
printf '\nathlete slug rewrites (must be 200, never a redirect)\n'
check /athletes/maya-okafor 200 'Discover Runners'
check /athletes/maya-okafor/manage 200 'Discover Runners'
check /athletes/not-a-real-slug-check 200 'Discover Runners'
check /athletes/not-a-real-slug-check/manage 200 'Discover Runners'

printf '\nicons and metadata routes\n'
check /favicon.ico 200
check /icon 200
check /apple-icon 200
check /opengraph-image 200
check /robots.txt 200
check /sitemap.xml 200

printf '\nnot-found fallback\n'
check /nope-not-a-page 404

printf '\napi reachable through the worker proxy\n'
check /v1/health/ready 200

printf '\n%s\n' "-------------------------------------------------------------"
printf '%d passed, %d failed, %d total\n' \
  "${PASS_COUNT}" "${FAIL_COUNT}" "$((PASS_COUNT + FAIL_COUNT))"

if [[ "${FAIL_COUNT}" -gt 0 ]]; then
  exit 1
fi
exit 0
