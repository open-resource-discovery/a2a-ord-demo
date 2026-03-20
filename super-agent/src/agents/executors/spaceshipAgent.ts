import { v4 as uuidv4 } from "uuid";
import type {
  Task,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
} from "@a2a-js/sdk";
import type {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
} from "@a2a-js/sdk/server";
import { config } from "../../config.js";

interface DiscoveredAgent {
  title: string;
  a2aEndpoint: string;
  skills: Array<{ id: string; name: string; tags: string[] }>;
}

interface OrdDocument {
  describedSystemInstance?: { baseUrl?: string };
  agents?: Array<{
    ordId: string;
    title: string;
    shortDescription?: string;
    exposedApiResources?: Array<{ ordId: string }>;
  }>;
  apiResources?: Array<{
    ordId: string;
    title: string;
    shortDescription?: string;
    apiProtocol?: string;
    resourceDefinitions?: Array<{
      type?: string;
      customType?: string;
      url?: string;
    }>;
  }>;
}

interface AgentCardJson {
  name: string;
  description: string;
  skills?: Array<{ id: string; name: string; tags?: string[] }>;
  url: string;
}

interface A2AResponse {
  result?: {
    status?: {
      state: string;
      message?: {
        parts?: Array<{ kind: string; text?: string }>;
      };
    };
  };
}

let cachedAgents: DiscoveredAgent[] | null = null;

async function crawlOrd(ordProviderUrl: string): Promise<DiscoveredAgent[]> {
  // 1. Read ORD well-known from the provider
  const wellKnownRes = await fetch(
    `${ordProviderUrl}/.well-known/open-resource-discovery`,
  );
  if (!wellKnownRes.ok)
    throw new Error(`Failed to fetch ORD well-known from ${ordProviderUrl}`);
  const wellKnown = await wellKnownRes.json();
  const docUrl = wellKnown.openResourceDiscoveryV1?.documents?.[0]?.url;
  if (!docUrl) throw new Error("No ORD document URL found");

  // 2. Read ORD document from the provider
  const fullDocUrl = docUrl.startsWith("http")
    ? docUrl
    : `${ordProviderUrl}${docUrl}`;
  const docRes = await fetch(fullDocUrl);
  if (!docRes.ok)
    throw new Error(`Failed to fetch ORD document from ${fullDocUrl}`);
  const doc: OrdDocument = await docRes.json();

  // 3. Resolve the described system's base URL (injected by the ORD provider)
  //    Resource definition URLs (agent cards, A2A) are relative to this system.
  const systemBaseUrl = doc.describedSystemInstance?.baseUrl;
  if (!systemBaseUrl)
    throw new Error(
      "ORD document is missing describedSystemInstance.baseUrl — cannot resolve agent card URLs",
    );

  const agents: DiscoveredAgent[] = [];

  // Build lookup: apiResource ordId -> apiResource
  const apiResourceMap = new Map(
    (doc.apiResources ?? []).map((api) => [api.ordId, api]),
  );

  // 4. Discover agents via ORD agents array
  //    Each agent declares exposedApiResources → we resolve the A2A agent card from the linked apiResource
  const ordAgents = doc.agents ?? [];

  for (const ordAgent of ordAgents) {
    // Find the linked A2A apiResource
    const exposedApiId = ordAgent.exposedApiResources?.[0]?.ordId;
    const api = exposedApiId ? apiResourceMap.get(exposedApiId) : undefined;
    if (!api) continue;

    // Find Agent Card resource definition
    const agentCardDef = api.resourceDefinitions?.find(
      (rd) =>
        rd.type === "a2a-agent-card" || rd.customType === "a2a:agent-card:v1",
    );
    if (!agentCardDef?.url) continue;

    // 5. Read Agent Card from the ORD provider (resource definitions are served by the provider)
    const cardFetchUrl = `${ordProviderUrl}${agentCardDef.url}`;
    const cardRes = await fetch(cardFetchUrl);
    if (!cardRes.ok) continue;
    const card: AgentCardJson = await cardRes.json();

    // Resolve A2A endpoint relative to the described system
    const a2aPath = new URL(card.url).pathname;

    agents.push({
      title: card.name || ordAgent.title,
      a2aEndpoint: `${systemBaseUrl}${a2aPath}`,
      skills: (card.skills ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        tags: s.tags ?? [],
      })),
    });
  }

  return agents;
}

async function discoverAgents(): Promise<DiscoveredAgent[]> {
  if (cachedAgents) return cachedAgents;
  cachedAgents = await crawlOrd(config.ordSourceUrl);
  return cachedAgents;
}

async function callAgent(
  a2aEndpoint: string,
  message: string,
): Promise<string> {
  const res = await fetch(a2aEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "message/send",
      params: {
        message: {
          role: "user",
          parts: [{ kind: "text", text: message }],
          messageId: `msg-${Date.now()}`,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`A2A call failed: ${res.status}`);
  const body: A2AResponse = await res.json();
  const parts = body.result?.status?.message?.parts ?? [];
  return parts
    .filter((p) => p.kind === "text" && p.text)
    .map((p) => p.text!)
    .join("");
}

function pickAgent(
  agents: DiscoveredAgent[],
  query: string,
): DiscoveredAgent | undefined {
  const q = query.toLowerCase();
  for (const agent of agents) {
    for (const skill of agent.skills) {
      if (
        skill.tags.some((t) => q.includes(t)) ||
        q.includes(skill.name.toLowerCase())
      ) {
        return agent;
      }
    }
  }
  return agents[0];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SpaceshipExecutor implements AgentExecutor {
  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const { taskId, contextId, userMessage, task } = requestContext;

    if (!task) {
      const initialTask: Task = {
        kind: "task",
        id: taskId,
        contextId,
        status: { state: "submitted", timestamp: new Date().toISOString() },
        history: [userMessage],
      };
      eventBus.publish(initialTask);
    }

    const workingUpdate: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId,
      contextId,
      status: { state: "working", timestamp: new Date().toISOString() },
      final: false,
    };
    eventBus.publish(workingUpdate);

    const userText = userMessage.parts
      .map((p) => ("text" in p && p.text ? p.text : ""))
      .filter(Boolean)
      .join(" ");

    let responseText: string;
    try {
      const agents = await discoverAgents();
      if (agents.length === 0) {
        responseText =
          "**Spaceship Commander**: No crew agents found via ORD. The ship is running on manual!";
      } else {
        const agent = pickAgent(agents, userText);
        if (!agent) {
          responseText =
            "**Spaceship Commander**: I couldn't find a crew member for that task. Try asking about space weather or city weather!";
        } else {
          const delegateResponse = await callAgent(agent.a2aEndpoint, userText);
          responseText = `**Spaceship Commander**: I found **${agent.title}** for this task.\n\n---\n\n${delegateResponse}`;
        }
      }
    } catch (err) {
      responseText = `**Spaceship Commander**: Failed to contact the crew — ${err}`;
    }

    const words = responseText.split(" ");
    let accumulated = "";
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? "" : " ") + words[i];
      accumulated += chunk;

      const artifact: TaskArtifactUpdateEvent = {
        kind: "artifact-update",
        taskId,
        contextId,
        ...(i > 0 && { append: true }),
        ...(i === words.length - 1 && { lastChunk: true }),
        artifact: {
          artifactId: `${taskId}-response`,
          name: "response",
          parts: [{ kind: "text", text: chunk }],
        },
      };
      eventBus.publish(artifact);
      await sleep(30);
    }

    const completedUpdate: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId,
      contextId,
      status: {
        state: "completed",
        timestamp: new Date().toISOString(),
        message: {
          kind: "message",
          messageId: uuidv4(),
          role: "agent",
          parts: [{ kind: "text", text: accumulated }],
          contextId,
          taskId,
        },
      },
      final: true,
    };
    eventBus.publish(completedUpdate);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => {};
}
