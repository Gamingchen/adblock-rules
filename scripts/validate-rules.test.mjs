import assert from "node:assert/strict";
import test from "node:test";
import { REQUIRED_DOMAINS, validateRules } from "./validate-rules.mjs";

const validSource = [
  "# Personal ad domains",
  "",
  ...REQUIRED_DOMAINS,
  "",
].join("\n");

test("accepts the seed list", () => {
  const result = validateRules(validSource);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(result.ruleCount, REQUIRED_DOMAINS.length);
});

test("allows comments and blank lines", () => {
  const result = validateRules(`# comment\n\n${REQUIRED_DOMAINS.join("\n")}\n`);
  assert.equal(result.ok, true);
});

test("rejects duplicate domains", () => {
  const result = validateRules(`${validSource}\n${REQUIRED_DOMAINS[0]}\n`);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /duplicate domain/);
});

test("rejects missing seed domains", () => {
  const result = validateRules(`${REQUIRED_DOMAINS[0]}\n`);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /required domain is missing/);
});

for (const [name, line, message] of [
  ["AdGuard syntax", "||example.org^", /AdGuard\/QX syntax/],
  ["URL", "https://example.org/list.txt", /URLs and paths/],
  ["policy syntax", "host, example.org, reject", /policy syntax/],
  ["wildcard", "*.example.org", /wildcards/],
  ["suffix notation", ".example.org", /suffix notation/],
  ["inline comment", "example.org # ad", /inline comments/],
  ["IP address", "192.0.2.1", /IP addresses and ports/],
  ["port", "example.org:443", /IP addresses and ports/],
  ["uppercase", "EXAMPLE.ORG", /lowercase/],
  ["invalid hostname", "not_a_hostname", /valid ASCII DNS hostname/],
]) {
  test(`rejects ${name}`, () => {
    const result = validateRules(`${validSource}\n${line}\n`);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), message);
  });
}
