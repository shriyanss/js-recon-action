#!/bin/bash
set -e

URL="${INPUT_URL}"
START_CMD="${INPUT_START_CMD:-}"
WORKING_DIR="${INPUT_WORKING_DIRECTORY:-.}"
VERSION="${INPUT_VERSION:-latest}"
BREAK_ON_MAP="${INPUT_BREAK_ON_MAP_FILES:-true}"
BREAK_ON_VULNS="${INPUT_BREAK_ON_VULNERABILITIES:-true}"
SEVERITY="${INPUT_VULNERABILITY_SEVERITY:-high}"
OUTPUT_DIR="${INPUT_OUTPUT_DIR:-js-recon-output}"

echo "[js-recon] Installing @shriyanss/js-recon@${VERSION}..."
npm install -g "@shriyanss/js-recon@${VERSION}"
INSTALLED_VERSION=$(js-recon --version 2>/dev/null || echo "unknown")
echo "[js-recon] Installed version: ${INSTALLED_VERSION}"

if [ -n "${START_CMD}" ]; then
    echo "[js-recon] Starting app with: ${START_CMD}"
    cd "${WORKING_DIR}"
    eval "${START_CMD}" &
    cd - > /dev/null

    echo "[js-recon] Waiting for ${URL} to be ready..."
    curl \
        --silent \
        --output /dev/null \
        --retry 30 \
        --retry-connrefused \
        --retry-delay 2 \
        --retry-max-time 120 \
        "${URL}" || {
        echo "[js-recon] ERROR: Timed out waiting for ${URL}"
        exit 1
    }
    echo "[js-recon] App is ready."
fi

echo "[js-recon] Running js-recon against ${URL}..."
js-recon run -u "${URL}" -o "${OUTPUT_DIR}" --no-sandbox -y -k || {
    echo "[js-recon] ERROR: js-recon run failed."
    exit 1
}

echo "[js-recon] Scan complete. Output saved to ${OUTPUT_DIR}/"

# Resolve the output path for deeply nested host directory
ABS_OUTPUT_DIR="$(cd "${OUTPUT_DIR}" 2>/dev/null && pwd || echo "${OUTPUT_DIR}")"
echo "output-path=${ABS_OUTPUT_DIR}" >> "${GITHUB_OUTPUT}"

# Check for .map source map files
MAP_FILES=$(find "${OUTPUT_DIR}" -name "*.map" 2>/dev/null | head -50)
if [ -n "${MAP_FILES}" ]; then
    echo "map-files-found=true" >> "${GITHUB_OUTPUT}"
    echo "[js-recon] Source map files detected:"
    echo "${MAP_FILES}"
    if [ "${BREAK_ON_MAP}" = "true" ]; then
        echo "[js-recon] ERROR: Source map files are publicly accessible. Set break-on-map-files: false to suppress."
        exit 1
    fi
else
    echo "map-files-found=false" >> "${GITHUB_OUTPUT}"
fi

# Find analyze.json — it lives inside a host subdirectory
ANALYZE_JSON=$(find "${OUTPUT_DIR}" -name "analyze.json" 2>/dev/null | head -1)

# Check vulnerabilities
VULN_COUNT=0
if [ -n "${ANALYZE_JSON}" ]; then
    VULN_COUNT=$(node /scripts/check-findings.js "${ANALYZE_JSON}" "${SEVERITY}" --count-only 2>/dev/null || echo 0)
fi
echo "vulnerability-count=${VULN_COUNT}" >> "${GITHUB_OUTPUT}"

if [ "${BREAK_ON_VULNS}" = "true" ] && [ -n "${ANALYZE_JSON}" ]; then
    node /scripts/check-findings.js "${ANALYZE_JSON}" "${SEVERITY}" || exit 1
fi
