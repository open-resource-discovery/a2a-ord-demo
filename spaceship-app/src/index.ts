import express from "express";
import { type AgentCard } from "@a2a-js/sdk";
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
import {
  agentCardHandler,
  jsonRpcHandler,
  UserBuilder,
} from "@a2a-js/sdk/server/express";
import { config } from "./config.js";
import { SolarSystemExecutor } from "./agents/executors/solarAgent.js";
import { RepairTechnicianExecutor } from "./agents/executors/repairAgent.js";
import { createOrdRouter } from "./ord.js";

// --- Solar System Explorer agent ---
const solarCard: AgentCard = {
  name: "Solar System Explorer",
  description:
    "Your guide to the solar system! Get weather reports, space facts, and astronomy events.",
  protocolVersion: "0.3.0",
  version: "1.0.0",
  url: `${config.serverUrl}/solar`,
  capabilities: { streaming: false, pushNotifications: false },
  skills: [
    {
      id: "solar-weather",
      name: "Solar System Weather",
      description:
        "Provides fun, fictional weather forecasts for planets in our solar system.",
      tags: ["weather", "planets", "space", "fun"],
      examples: [
        "What's the weather like on Mars today?",
        "How's the weather on Jupiter?",
      ],
    },
    {
      id: "space-facts",
      name: "Space Facts",
      description:
        "Share fascinating facts about planets, moons, and celestial objects.",
      tags: ["facts", "planets", "education"],
      examples: [
        "Tell me a fact about Saturn's rings",
        "How big is the Sun compared to Earth?",
      ],
    },
  ],
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  provider: { organization: "SAP SE", url: "https://sap.com" },
};

const solarHandler = new DefaultRequestHandler(
  solarCard,
  new InMemoryTaskStore(),
  new SolarSystemExecutor(),
);

// --- Repair Technician agent ---
const repairCard: AgentCard = {
  name: "Repair Technician",
  description:
    "The ship's repair system. Diagnoses and fixes engines, hull breaches, shields, power systems, and life support.",
  protocolVersion: "0.3.0",
  version: "1.0.0",
  url: `${config.serverUrl}/repair`,
  capabilities: { streaming: false, pushNotifications: false },
  skills: [
    {
      id: "engine-repair",
      name: "Engine Repair",
      description: "Diagnoses and repairs propulsion and engine systems.",
      tags: ["repair", "engine", "propulsion", "fix"],
      examples: ["The engines are overheating", "Propulsion system is failing"],
    },
    {
      id: "hull-diagnostics",
      name: "Hull Diagnostics",
      description:
        "Detects and repairs hull damage, breaches, and structural issues.",
      tags: ["hull", "damage", "shields", "diagnostics"],
      examples: ["Hull breach on deck 3", "The shields are failing"],
    },
  ],
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  provider: { organization: "SAP SE", url: "https://sap.com" },
};

const repairHandler = new DefaultRequestHandler(
  repairCard,
  new InMemoryTaskStore(),
  new RepairTechnicianExecutor(),
);

const app = express();
app.use(express.json());

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, A2A-Version",
  );
  if (_req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Solar agent — JSON-RPC at base path, agent card at /solar/.well-known/agent.json
app.use(
  "/solar/.well-known/agent.json",
  agentCardHandler({ agentCardProvider: solarHandler }),
);
app.use(
  "/solar",
  jsonRpcHandler({
    requestHandler: solarHandler,
    userBuilder: UserBuilder.noAuthentication,
  }),
);

// Repair agent — JSON-RPC at base path, agent card at /repair/.well-known/agent.json
app.use(
  "/repair/.well-known/agent.json",
  agentCardHandler({ agentCardProvider: repairHandler }),
);
app.use(
  "/repair",
  jsonRpcHandler({
    requestHandler: repairHandler,
    userBuilder: UserBuilder.noAuthentication,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ORD endpoints (shared — one ORD document describes both agents)
app.use(createOrdRouter(config.serverUrl));

const server = app.listen(config.port, () => {
  console.log(`\nSpaceship App running on port ${config.port}\n`);
  console.log(`  Solar Agent Card:   ${config.serverUrl}/solar/.well-known/agent.json`);
  console.log(`  Solar A2A:          ${config.serverUrl}/solar`);
  console.log(`  Repair Agent Card:  ${config.serverUrl}/repair/.well-known/agent.json`);
  console.log(`  Repair A2A:         ${config.serverUrl}/repair`);
  console.log(`  Health:             ${config.serverUrl}/health`);
  console.log(`  ORD:                ${config.serverUrl}/.well-known/open-resource-discovery`,
  );
});

export { app, server };
