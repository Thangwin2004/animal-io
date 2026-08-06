#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";

const EXPECTED_SHA256 =
  "afe2a789466c3d68f4eec7d8cf2e718f45a29a19a5d8b9eb8c4cec10b18f31eb";
const EXPECTED_PARENT = "https://winkgames.papastudio.net";
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
  config.bridgeVersion !== "9.0.0" ||
  JSON.stringify(config.allowedParentOrigins) !== JSON.stringify([EXPECTED_PARENT]) ||
  lock.bridgeVersion !== "9.0.0" ||
  lock.protocolVersion !== 1 ||
  lock.sha256 !== EXPECTED_SHA256 ||
  lock.bytes !== artifact.byteLength ||
  sha256 !== EXPECTED_SHA256 ||
  indexHtml.indexOf('<script src="/wink-bridge.js"></script>') < 0
) {
  throw new Error("Wink production bridge contract is invalid");
}

console.log(
  `wink bridge verified version=9.0.0 protocol=1 bytes=${artifact.byteLength} sha256=${sha256} environment=prod gameId=${config.gameId}`,
);
