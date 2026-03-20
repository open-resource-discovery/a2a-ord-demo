import express from "express";
import { type AgentCard } from "@a2a-js/sdk";
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
import {
  agentCardHandler,
  jsonRpcHandler,
  UserBuilder,
} from "@a2a-js/sdk/server/express";
import { config } from "./config.js";
import { SpaceshipExecutor } from "./agents/executors/spaceshipAgent.js";

const agentCard: AgentCard = {
  name: "My Spaceship",
  description:
    "Your spaceship commander! Discovers crew agents via ORD and delegates tasks via A2A.",
  protocolVersion: "0.3.0",
  version: "1.0.0",
  url: `${config.serverUrl}`,
  capabilities: { streaming: false, pushNotifications: false },
  skills: [
    {
      id: "spaceship-command",
      name: "Spaceship Command",
      description:
        "Orchestrates crew agents discovered via ORD. Ask anything and the commander will find the right crew member.",
      tags: ["spaceship", "commander", "orchestration", "delegation"],
      examples: [
        "The engines are overheating!",
        "What's the weather on Mars?",
        "Hull breach on deck 3!",
      ],
    },
  ],
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  provider: { organization: "SAP SE", url: "https://sap.com" },
};

const requestHandler = new DefaultRequestHandler(
  agentCard,
  new InMemoryTaskStore(),
  new SpaceshipExecutor(),
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

app.use(
  "/.well-known/agent.json",
  agentCardHandler({ agentCardProvider: requestHandler }),
);

app.use(
  "/",
  jsonRpcHandler({
    requestHandler,
    userBuilder: UserBuilder.noAuthentication,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = app.listen(config.port, () => {
  console.log(`\nMy Spaceship running on port ${config.port}\n`);
  console.log(`  Agent card:  ${config.serverUrl}/.well-known/agent.json`);
  console.log(`  A2A:         ${config.serverUrl}`);
  console.log(`  Health:      ${config.serverUrl}/health`);
  console.log(`  ORD source:  ${config.ordSourceUrl}`);
});

export { app, server };
