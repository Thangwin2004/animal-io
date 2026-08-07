#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";

const EXPECTED_SHA256 =
  "2c116572babd9d850f19a91ff68669395eb3c8cd268c34f85be3d13d5625e29c";
const EXPECTED_PARENTS = [
  "https://winkgames.papastudio.net",
  "http://localhost:3000",
];
const EXPECTED_GAME_ID = "8c16d0b3-8fec-444e-aaae-5b89e123b537";

const [artifact, lockText, configText, indexHtml] = await Promise.all([
  fs.readFile("public/wink-bridge.js"),
  fs.readFile("public/wink-bridge.lock.json", "utf8"),
  fs.readFile("public/wink-runtime-config.json", "utf8"),
  fs.readFile("index.html", "utf8"),
]);
const lock = JSON.parse(lockText);
const config = JSON.parse(configText);
const sha256 = crypto.createHash("sha256").update(artifact).digest("hex");

if (
  Object.keys(config).sort().join(",") !==
    "allowedParentOrigins,bridgeVersion,environment,gameId,protocolVersion" ||
  config.gameId !== EXPECTED_GAME_ID ||
  config.environment !== "prod" ||
  config.protocolVersion !== 1 ||
  config.bridgeVersion !== "9.0.1" ||
  JSON.stringify(config.allowedParentOrigins) !==
    JSON.stringify(EXPECTED_PARENTS) ||
  lock.bridgeVersion !== "9.0.1" ||
  lock.protocolVersion !== 1 ||
  lock.sha256 !== EXPECTED_SHA256 ||
  lock.bytes !== artifact.byteLength ||
  sha256 !== EXPECTED_SHA256 ||
  indexHtml.indexOf('<script src="/wink-bridge.js"></script>') < 0
) {
  throw new Error("Wink production bridge contract is invalid");
}

console.log(
  `wink bridge verified version=9.0.1 protocol=1 bytes=${artifact.byteLength} sha256=${sha256} environment=prod gameId=${config.gameId}`,
);
