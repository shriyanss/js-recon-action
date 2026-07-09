// Unit tests for check-findings.js using Node 22 built-in test runner
// Run: node --test scripts/check-findings.test.js

import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const SCRIPT = new URL("./check-findings.js", import.meta.url).pathname;

function run(filePath, severity, extraArgs = []) {
    const args = [SCRIPT, filePath, severity, ...extraArgs];
    return spawnSync(process.execPath, args, { encoding: "utf8" });
}

function withFile(content) {
    const dir = mkdtempSync(join(tmpdir(), "jsr-test-"));
    const file = join(dir, "analyze.json");
    writeFileSync(file, JSON.stringify(content));
    return { file, cleanup: () => rmSync(dir, { recursive: true }) };
}

const HIGH = { ruleId: "r1", ruleName: "Test High", severity: "high", message: "msg", findingLocation: "/foo.js" };
const MEDIUM = { ...HIGH, ruleId: "r2", ruleName: "Test Medium", severity: "medium" };
const LOW = { ...HIGH, ruleId: "r3", ruleName: "Test Low", severity: "low" };
const INFO = { ...HIGH, ruleId: "r4", ruleName: "Test Info", severity: "info" };

test("high threshold only blocks high findings", () => {
    const { file, cleanup } = withFile([HIGH]);
    const result = run(file, "high");
    cleanup();
    assert.notEqual(result.status, 0, "should fail when high finding present");
});

test("high threshold passes when no high findings", () => {
    const { file, cleanup } = withFile([MEDIUM, LOW]);
    const result = run(file, "high");
    cleanup();
    assert.equal(result.status, 0, "should pass when only medium/low findings");
});

test("medium threshold blocks medium and high", () => {
    const { file, cleanup } = withFile([HIGH, MEDIUM, LOW]);
    const result = run(file, "medium", ["--count-only"]);
    cleanup();
    assert.equal(result.stdout.trim(), "2", "should count 2 findings (high + medium)");
});

test("low threshold blocks low, medium, high", () => {
    const { file, cleanup } = withFile([HIGH, MEDIUM, LOW, INFO]);
    const result = run(file, "low", ["--count-only"]);
    cleanup();
    assert.equal(result.stdout.trim(), "3", "should count 3 findings (high + medium + low)");
});

test("info findings never counted at medium threshold", () => {
    const { file, cleanup } = withFile([INFO]);
    const result = run(file, "medium");
    cleanup();
    assert.equal(result.status, 0, "info finding should not trigger medium threshold");
});

test("empty array exits 0", () => {
    const { file, cleanup } = withFile([]);
    const result = run(file, "high");
    cleanup();
    assert.equal(result.status, 0, "empty findings array should exit 0");
});

test("missing file exits 0", () => {
    const result = run("/nonexistent/analyze.json", "high");
    assert.equal(result.status, 0, "missing file should exit 0 gracefully");
});

test("count-only mode returns correct count", () => {
    const { file, cleanup } = withFile([HIGH, HIGH, MEDIUM]);
    const result = run(file, "high", ["--count-only"]);
    cleanup();
    assert.equal(result.stdout.trim(), "2", "count-only should return 2 high findings");
});

test("count-only returns 0 for missing file", () => {
    const result = run("", "high", ["--count-only"]);
    assert.equal(result.stdout.trim(), "0", "count-only should return 0 for missing file");
});
