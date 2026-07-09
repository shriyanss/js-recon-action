#!/usr/bin/env node
// check-findings.js <analyze.json> <severity> [--count-only]
// Exits with the count of findings at or above the severity threshold.
// Exit code 0 if no findings; non-zero equal to the count (capped at 255) otherwise.

import { readFileSync, existsSync } from "fs";
import { argv, exit } from "process";

const SEVERITY_RANK = { info: 0, low: 1, medium: 2, high: 3 };

const filePath = argv[2] || "";
const threshold = (argv[3] || "high").toLowerCase();
const countOnly = argv.includes("--count-only");

if (!SEVERITY_RANK.hasOwnProperty(threshold)) {
    if (!countOnly) {
        console.error(
            `[js-recon] Invalid severity "${threshold}". Use: low, medium, high`
        );
    }
    exit(1);
}

if (!filePath || !existsSync(filePath)) {
    if (!countOnly) {
        console.log("[js-recon] No analyze.json found. Skipping vulnerability check.");
    } else {
        console.log("0");
    }
    exit(0);
}

let findings;
try {
    findings = JSON.parse(readFileSync(filePath, "utf8"));
} catch {
    if (!countOnly) {
        console.log("[js-recon] analyze.json is empty or invalid. Skipping.");
    } else {
        console.log("0");
    }
    exit(0);
}

if (!Array.isArray(findings) || findings.length === 0) {
    if (!countOnly) {
        console.log("[js-recon] No findings in analyze.json.");
    } else {
        console.log("0");
    }
    exit(0);
}

const thresholdRank = SEVERITY_RANK[threshold];
const matched = findings.filter(
    (f) => SEVERITY_RANK[f.severity?.toLowerCase()] >= thresholdRank
);

if (countOnly) {
    console.log(String(matched.length));
    exit(0);
}

if (matched.length === 0) {
    console.log(
        `[js-recon] No findings at or above severity "${threshold}".`
    );
    exit(0);
}

console.log(
    `[js-recon] ${matched.length} finding(s) at or above severity "${threshold}":\n`
);
console.log(
    `${"Rule".padEnd(40)} ${"Severity".padEnd(10)} Location`
);
console.log("-".repeat(80));
for (const f of matched) {
    const rule = (f.ruleName || f.ruleId || "unknown").substring(0, 39).padEnd(40);
    const sev = (f.severity || "?").padEnd(10);
    const loc = f.findingLocation || "";
    console.log(`${rule} ${sev} ${loc}`);
}

console.log(
    `\n[js-recon] ERROR: ${matched.length} vulnerability/vulnerabilities detected at severity "${threshold}" or above.`
);
console.log(
    `           Set break-on-vulnerabilities: false or raise vulnerability-severity to suppress.`
);

exit(matched.length > 255 ? 255 : matched.length);
