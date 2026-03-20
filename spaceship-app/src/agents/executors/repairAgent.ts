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

const REPAIRS: Record<string, string[]> = {
  engine: [
    `**Engine Repair Report**\n\n**System**: Main Propulsion Unit\n**Status**: Overheating detected in coolant loop B-7.\n**Action Taken**: Flushed coolant lines, replaced thermal regulator valve, recalibrated ignition timing.\n**Result**: Engine temperature normalized at 1,200 K. Thrust output restored to 98%.\n**Note**: Schedule full coolant system flush at next starport.`,
    `**Engine Repair Report**\n\n**System**: Main Propulsion Unit\n**Status**: Fuel injector misalignment in chamber 3 causing asymmetric thrust.\n**Action Taken**: Realigned injector array using laser calibration jig. Replaced worn nozzle seals.\n**Result**: Thrust balance restored. Specific impulse back to rated 340 s.\n**Note**: Injector nozzles showing 60% wear — full replacement at next overhaul.`,
    `**Engine Repair Report**\n\n**System**: Auxiliary Thruster Bank\n**Status**: Thruster A-4 failed to fire during docking maneuver. Frozen propellant line suspected.\n**Action Taken**: Applied thermal blanket to propellant feed. Cleared ice blockage with heated nitrogen purge.\n**Result**: All 8 auxiliary thrusters responding. Docking authority restored.\n**Note**: Install improved thermal insulation on exposed propellant lines.`,
    `**Engine Repair Report**\n\n**System**: Main Propulsion Unit\n**Status**: Turbopump vibration exceeding tolerance — bearing wear detected at 12,000 RPM.\n**Action Taken**: Replaced turbopump bearing assembly. Balanced rotor to within 0.001 mm. Ran 30-minute break-in cycle.\n**Result**: Vibration levels nominal. Pump operating at rated 15,000 RPM.\n**Note**: Old bearing showed signs of contamination — check fuel filtration system.`,
    `**Engine Repair Report**\n\n**System**: FTL Drive\n**Status**: Warp field asymmetry detected — port nacelle generating 3% more field distortion than starboard.\n**Action Taken**: Recalibrated warp coil phase alignment. Degaussed nacelle cores. Updated field geometry firmware.\n**Result**: Warp field symmetric within 0.1%. Safe for FTL travel up to Warp 7.\n**Note**: Full nacelle inspection recommended before any Warp 9+ attempts.`,
  ],
  hull: [
    `**Hull Integrity Report**\n\n**System**: Outer Hull — Deck 3, Section 12\n**Status**: Micro-fractures detected along starboard plating. Pressure seal compromised.\n**Action Taken**: Deployed nano-repair drones to weld fractures. Applied emergency sealant layer. Reinforced with titanium-carbide patches.\n**Result**: Hull integrity restored to 96%. Cabin pressure holding steady at 101.3 kPa.\n**Note**: Full hull resurface recommended at next dry dock.`,
    `**Hull Integrity Report**\n\n**System**: Forward Hull — Bow Section\n**Status**: Micrometeorite impact cluster — 12 penetrations ranging 0.5–3 mm diameter.\n**Action Taken**: Sealed punctures with self-expanding ceramic foam. Deployed external patch plates over impact zone.\n**Result**: Hull integrity at 94%. All compartments holding pressure.\n**Note**: Install Whipple shield upgrade to forward section — this area takes the most impacts.`,
    `**Hull Integrity Report**\n\n**System**: Ventral Hull — Landing Strut Bay\n**Status**: Stress fracture along weld seam from heavy-gravity landing (2.4g). Bay door jammed.\n**Action Taken**: Cut out cracked weld section. Re-welded with reinforced alloy filler rod. Freed bay door mechanism.\n**Result**: Hull integrity at 97%. Landing struts deploy and retract normally.\n**Note**: Avoid landings above 2.0g until full structural analysis is complete.`,
    `**Hull Integrity Report**\n\n**System**: Cargo Bay — Section 7\n**Status**: Corrosion detected along interior hull panels. Atmospheric recycler was leaking acidic condensate.\n**Action Taken**: Neutralized corrosion with alkaline wash. Replaced affected panels (4 m²). Fixed recycler condensate drain.\n**Result**: Hull integrity at 99%. No structural compromise.\n**Note**: Add corrosion monitoring sensors to all cargo bays.`,
    `**Hull Integrity Report**\n\n**System**: Observation Dome — Deck 1\n**Status**: Thermal stress cracks in transparent aluminum viewport after rapid temperature cycling.\n**Action Taken**: Replaced viewport panel with new unit rated for −200 °C to +300 °C cycling. Upgraded thermal expansion gaskets.\n**Result**: Viewport clear and sealed. Pressure test passed at 150% nominal.\n**Note**: Reduce thermal cycling by maintaining dome heating during cold-side orbits.`,
  ],
  shields: [
    `**Shield System Report**\n\n**System**: Deflector Shield Array\n**Status**: Shield generator 2 offline. Power coupling overloaded during asteroid field transit.\n**Action Taken**: Replaced blown power coupling. Recalibrated shield harmonics. Redistributed power from auxiliary generators.\n**Result**: Shields online at 85% capacity. Full restoration requires replacement of generator 2 coil.\n**Note**: Avoid high-radiation zones until coil is replaced.`,
    `**Shield System Report**\n\n**System**: Deflector Shield Array\n**Status**: Shield flicker at 4 Hz — resonance cascade between generators 1 and 3.\n**Action Taken**: Phase-shifted generator 3 output by 15°. Updated harmonic damping firmware.\n**Result**: Shields stable at 100%. No flicker detected after 2-hour burn-in test.\n**Note**: Harmonic analysis should be part of routine monthly maintenance.`,
    `**Shield System Report**\n\n**System**: Point Defense Shields\n**Status**: Localized shield failure in aft quadrant during weapons test. Emitter burnout on turret 6.\n**Action Taken**: Replaced emitter crystal on turret 6. Re-mapped shield coverage to overlap from adjacent turrets.\n**Result**: Full aft coverage restored. Response time 3 ms (within spec).\n**Note**: Stock spare emitter crystals — they're the most common failure point.`,
    `**Shield System Report**\n\n**System**: Radiation Shields\n**Status**: Gamma ray exposure on Deck 5 exceeded safe limits during solar flare transit. Shield absorption at 94% — needed 99.9%.\n**Action Taken**: Boosted shield power allocation by 40%. Added supplemental lead-bismuth lining to Deck 5 crew quarters.\n**Result**: Radiation levels now within safe margins even at 94% shield efficiency.\n**Note**: Route planning should avoid known solar flare zones when shields are below 98%.`,
    `**Shield System Report**\n\n**System**: Navigational Deflector\n**Status**: Deflector dish misaligned after debris strike. Particle clearing cone shifted 2° off centerline.\n**Action Taken**: Realigned deflector dish servos. Replaced bent mounting strut. Recalibrated particle sweep pattern.\n**Result**: Deflection cone centered. Safe for travel up to 0.5c.\n**Note**: At higher velocities, even small debris is lethal — always verify deflector alignment before acceleration.`,
  ],
  power: [
    `**Power Systems Report**\n\n**System**: Main Reactor & Power Distribution\n**Status**: Intermittent power fluctuations in grid C. Backup batteries at 43%.\n**Action Taken**: Isolated faulty relay in junction C-14. Rerouted power through secondary bus. Initiated emergency battery recharge cycle.\n**Result**: Power grid stable. Batteries recharging at normal rate.\n**Note**: Replace relay at earliest convenience.`,
    `**Power Systems Report**\n\n**System**: Solar Collector Array\n**Status**: Panel efficiency dropped to 62% — dust accumulation and micrometeorite pitting.\n**Action Taken**: Deployed cleaning drones to remove dust layer. Polished pitted surfaces. Replaced 3 cracked cells.\n**Result**: Array efficiency restored to 91%. Power output nominal for current orbital distance.\n**Note**: Panels are aging — plan full array replacement within 2 years.`,
    `**Power Systems Report**\n\n**System**: Main Reactor\n**Status**: Containment field fluctuation — magnetic bottle oscillating ±2% beyond tolerance.\n**Action Taken**: Recalibrated superconducting magnets. Replaced helium-3 feed regulator. Ran 4-hour stability test.\n**Result**: Containment field rock-solid at 99.97% stability. Reactor output nominal.\n**Note**: This was close to a SCRAM threshold. Never delay containment maintenance.`,
    `**Power Systems Report**\n\n**System**: Emergency Power\n**Status**: UPS bank 2 failed self-test. 4 of 12 capacitor modules showing degraded charge retention.\n**Action Taken**: Replaced 4 degraded capacitor modules. Ran full discharge-recharge cycle on all 12 modules.\n**Result**: UPS bank 2 passing all self-tests. 45-minute emergency power guaranteed.\n**Note**: Capacitor modules have a 5-year service life — mark calendar for next batch replacement.`,
    `**Power Systems Report**\n\n**System**: Power Distribution\n**Status**: Deck 7 brownout during simultaneous cargo crane + airlock cycling operation. Bus overloaded.\n**Action Taken**: Upgraded Deck 7 power bus from 200A to 350A rated breaker. Added load-shedding priority firmware.\n**Result**: Deck 7 can now handle simultaneous high-draw operations without brownout.\n**Note**: Review power budgets for all decks — the ship has more equipment than original design spec.`,
  ],
  life: [
    `**Life Support Report**\n\n**System**: Atmospheric Processing & Climate Control\n**Status**: CO2 scrubber efficiency dropped to 72%. Cabin temperature drifting +3°C above nominal.\n**Action Taken**: Replaced carbon filter cartridges in scrubber units 1 and 3. Recalibrated HVAC thermal regulators.\n**Result**: Air quality nominal. Temperature holding at 22°C.\n**Note**: Stock additional filter cartridges before deep-space transit.`,
    `**Life Support Report**\n\n**System**: Water Reclamation\n**Status**: Recycled water showing elevated mineral content — filtration membrane partially blocked.\n**Action Taken**: Back-flushed filtration membranes. Replaced UV sterilization bulb. Added mineral ion-exchange stage.\n**Result**: Water quality at 99.7% purity. Safe for drinking and hydroponics.\n**Note**: Membrane replacement due in 500 operating hours.`,
    `**Life Support Report**\n\n**System**: Oxygen Generation\n**Status**: Electrolysis unit 2 producing hydrogen but not separating oxygen — membrane failure.\n**Action Taken**: Replaced proton-exchange membrane. Flushed gas separation plumbing. Recalibrated O₂/H₂ sensors.\n**Result**: O₂ production at rated 2.4 kg/hour. Atmosphere mix at 21% O₂ / 78% N₂.\n**Note**: Hydrogen byproduct being safely vented. Consider fuel-cell capture for power supplement.`,
    `**Life Support Report**\n\n**System**: Gravity Plating\n**Status**: Deck 4 gravity fluctuating between 0.8g and 1.1g — crew reporting nausea.\n**Action Taken**: Recalibrated graviton emitters in Deck 4 floor plates. Replaced controller board in section 4-C.\n**Result**: Gravity stable at 1.00g ± 0.01g across all Deck 4 sections.\n**Note**: Gravity plating draws significant power — monitor for brownout interaction with other systems.`,
    `**Life Support Report**\n\n**System**: Fire Suppression\n**Status**: Smoke detector in Engineering triggered false alarm. Halon reserves at 60% after accidental partial discharge.\n**Action Taken**: Cleaned smoke detector optics (oil vapor buildup). Refilled Halon reserves to 100%. Tested all zone triggers.\n**Result**: Fire suppression fully operational. All zones responding within 0.5 seconds.\n**Note**: Install oil mist separators near engineering ventilation intakes to prevent recurrence.`,
  ],
};

const DIAGNOSTICS = [
  "All primary systems nominal. Warp drive standing by. Fuel reserves at 78%.",
  "Routine scan complete: 2 minor wear items flagged — port thruster bearing and starboard airlock gasket. Non-critical.",
  "Structural integrity at 94%. Recommend inspection of forward sensor array — intermittent signal dropout detected.",
  "Power distribution balanced across all decks. Solar collectors operating at peak efficiency.",
  "Full-spectrum diagnostic complete. Navigation computer firmware is 2 versions behind — update recommended but not critical.",
  "Thermal imaging sweep done. No hot spots detected. All insulation panels performing within spec.",
  "Comms array self-test passed. Subspace transceiver locked on 3 relay beacons. Signal strength excellent.",
  "Cargo bay environmental scan clear. No biohazard, no radiation, humidity at 45%. Good for sensitive cargo.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRepair(query: string): string {
  const q = query.toLowerCase();
  for (const [system, reports] of Object.entries(REPAIRS)) {
    if (q.includes(system)) return pickRandom(reports);
  }
  if (/overheat|temperature|cool/i.test(q))
    return pickRandom(REPAIRS["engine"]!);
  if (/breach|crack|fracture|plating/i.test(q))
    return pickRandom(REPAIRS["hull"]!);
  if (/shield|deflect|protect/i.test(q)) return pickRandom(REPAIRS["shields"]!);
  if (/power|energy|battery|reactor/i.test(q))
    return pickRandom(REPAIRS["power"]!);
  if (/oxygen|air|co2|climate|breath/i.test(q))
    return pickRandom(REPAIRS["life"]!);
  return pickRandom(REPAIRS["engine"]!);
}

function isRepairQuery(text: string): boolean {
  return /repair|fix|broken|damage|fail|overheat|breach|offline|leak|malfunction|hull|engine|shield|power|life.?support/i.test(
    text,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RepairTechnicianExecutor implements AgentExecutor {
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
    if (isRepairQuery(userText)) {
      responseText = getRepair(userText);
    } else {
      responseText = `**Diagnostic Scan**\n\n${pickRandom(DIAGNOSTICS)}`;
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
