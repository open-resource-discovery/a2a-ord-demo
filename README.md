[![REUSE status](https://api.reuse.software/badge/github.com/open-resource-discovery/a2a-ord-demo)](https://api.reuse.software/info/github.com/open-resource-discovery/a2a-ord-demo)
[![CI](https://github.com/open-resource-discovery/a2a-ord-demo/actions/workflows/main.yml/badge.svg)](https://github.com/open-resource-discovery/a2a-ord-demo/actions/workflows/main.yml)

# ORD + A2A Demo

A demo showing how [Open Resource Discovery (ORD)](https://open-resource-discovery.github.io/) and [Agent-to-Agent (A2A)](https://google.github.io/A2A/) work together: discover agents via ORD metadata, then communicate with them via the A2A protocol.

## Architecture

```
  Spaceship App                                 Commander (super-agent)
  ┌──────────────────────┐                      ┌────────────────────────┐
  │ Solar Explorer       │    ORD discovery     │ "My Spaceship"         │
  │   /solar             │ <─────────────────── │                        │
  │ Repair Technician    │                      │  1. discovers agents   │
  │   /repair            │    A2A (JSON-RPC)    │     via ORD            │
  │ ORD endpoint         │ <─────────────────── │  2. resolves cards     │
  │   /ord/v1/...        │                      │  3. delegates via A2A  │
  └──────────────────────┘                      └────────────────────────┘
  :3001                                          :3002
```

| Service              | Port | Role                                                                                                                       |
| -------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| `spaceship-app`      | 3001 | Hosts 2 A2A agents (Solar Explorer + Repair Technician) and serves ORD documents                                           |
| `super-agent`        | 3002 | Commander — discovers agents via ORD, delegates via A2A                                                                    |
| `ord-provider-super` | 3004 | Serves ORD documents for the super-agent via [provider-server](https://github.com/open-resource-discovery/provider-server) |

## Quick Start

```bash
demo/demo.sh       # build, start services
demo/demo.sh down  # tear down
```

Then open [`demo/demo.http`](demo/demo.http) in VS Code with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for a guided walkthrough.

### A2A Editor

You can also try the agents in the [A2A Editor Playground](https://open-resource-discovery.github.io/a2a-editor/playground). The editor requires the **full URL to the agent card file**:

| Agent              | Agent Card URL                            |
| ------------------ | ----------------------------------------- |
| Repair Technician  | `http://localhost:3001/repair/agent.json` |
| Solar Explorer     | `http://localhost:3001/solar/agent.json`  |
| Commander          | `http://localhost:3002`                   |

## Contributing

If you wish to contribute code or offer feedback for this project, please see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Copyright 2026 SAP SE or an SAP affiliate company and a2a-ord-demo contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/open-resource-discovery/a2a-ord-demo).
