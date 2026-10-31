import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_DOMAINS = Object.freeze([
  "ssp.iytcdn.com",
  "tnc3-alisc1.zijieapi.com",
  "mssdk.volces.com",
  "mamasearchad.cloudvideocdn.taobao.com",
  "alimama.cloudvideocdn.taobao.com",
]);

const DOMAIN_RE =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/;

export function validateRules(text, options = {}) {
  const requiredDomains = options.requiredDomains ?? REQUIRED_DOMAINS;
  const errors = [];
  const domains = [];
  const seen = new Map();
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (line === "" || line.startsWith("#")) return;

    const reject = (message) => {
      errors.push(`line ${lineNumber}: ${message}`);
    };

    if (line !== line.toLowerCase()) {
      reject("domain must be lowercase");
      return;
    }
    if (line.startsWith("||") || line.includes("^")) {
      reject("AdGuard/QX syntax is not allowed; write only the hostname");
      return;
    }
    if (/^(?:https?|wss?):\/\//i.test(line) || line.includes("/")) {
      reject("URLs and paths are not allowed");
      return;
    }
    if (line.includes(",")) {
      reject("policy syntax and commas are not allowed");
      return;
    }
    if (line.includes("*") || line.includes("?")) {
      reject("wildcards are not allowed");
      return;
    }
    if (line.startsWith(".")) {
      reject("suffix notation is not allowed; list an exact hostname");
      return;
    }
    if (line.includes("#")) {
      reject("inline comments are not allowed");
      return;
    }
    if (line.includes(":") || net.isIP(line) !== 0) {
      reject("IP addresses and ports are not allowed");
      return;
    }
    if (!DOMAIN_RE.test(line)) {
      reject("not a valid ASCII DNS hostname");
      return;
    }
    if (seen.has(line)) {
      reject(`duplicate domain; first seen on line ${seen.get(line)}`);
      return;
    }

    seen.set(line, lineNumber);
    domains.push(line);
  });

  for (const domain of requiredDomains) {
    if (!seen.has(domain)) {
      errors.push(`required domain is missing: ${domain}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    domains,
    ruleCount: domains.length,
  };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const filePath = path.resolve(process.argv[2] ?? "docs/personal-ads.txt");
  let content;

  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Unable to read ${filePath}: ${error.message}`);
    process.exit(1);
  }

  const result = validateRules(content);
  if (!result.ok) {
    console.error(`Validation failed for ${filePath}:`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`OK: ${result.ruleCount} exact DNS hostnames in ${filePath}`);
}
