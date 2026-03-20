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

const WEATHER: Record<string, string[]> = {
  mercury: [
    `**Mercury Weather Report**\n\n**Current Conditions**: 430 °C on the sun-facing side, −180 °C in the shadow. No atmosphere to speak of — just raw cosmic extremes.\n**Wind**: None — no atmosphere means no wind!\n**Forecast**: Expect more of the same for the next 4 billion years. Sunscreen won't help.`,
    `**Mercury Weather Report**\n\n**Current Conditions**: Dawn terminator zone — temperature swinging wildly from −170 °C to 400 °C within minutes.\n**Radiation**: Extreme solar particle bombardment. Magnetic field too weak to deflect.\n**Forecast**: Solar flare incoming — recommend retreating to shadowed crater.`,
    `**Mercury Weather Report**\n\n**Current Conditions**: Nightside stable at −180 °C. Caloris Basin experiencing thermal afterglow from recent sunrise.\n**Visibility**: Crystal clear — no atmosphere means no weather haze.\n**Forecast**: 88 Earth-day "year" means sunrise in 22 days. Prepare for rapid heating.`,
    `**Mercury Weather Report**\n\n**Current Conditions**: Surface baking at 427 °C near subsolar point. Ice deposits confirmed in permanently shadowed polar craters at −193 °C.\n**Wind**: Zero. Vacuum conditions.\n**Forecast**: Stable extremes. The ice isn't going anywhere — those craters haven't seen sunlight in billions of years.`,
    `**Mercury Weather Report**\n\n**Current Conditions**: 350 °C at mid-latitudes. Sodium exosphere trace detected — the "atmosphere" is thinner than Earth's best lab vacuums.\n**Micrometeorites**: Elevated flux from cometary debris stream.\n**Forecast**: Watch for impact-generated dust plumes near horizon at dawn.`,
  ],
  venus: [
    `**Venus Weather Report**\n\n**Current Conditions**: A toasty 465 °C surface temperature with crushing atmospheric pressure (90× Earth). Thick sulfuric-acid clouds blanket the sky.\n**Wind**: 360 km/h super-rotation winds in the upper atmosphere.\n**Forecast**: Permanent overcast. Don't forget your acid-resistant umbrella.`,
    `**Venus Weather Report**\n\n**Current Conditions**: 462 °C at surface. Sulfuric acid rain is evaporating 25 km before reaching ground — "virga" on a planetary scale.\n**Pressure**: 92 bar — equivalent to 900 m underwater on Earth.\n**Forecast**: Acid cloud layer stable at 48–70 km altitude. Visibility near zero below 30 km.`,
    `**Venus Weather Report**\n\n**Current Conditions**: Upper atmosphere at 55 km is a surprisingly pleasant 27 °C and 0.5 bar — the most Earth-like spot in the solar system outside Earth.\n**Wind**: 100 m/s zonal flow carrying clouds around the planet in 4 days.\n**Forecast**: Lightning detected in cloud deck. Possible phosphine anomaly under investigation.`,
    `**Venus Weather Report**\n\n**Current Conditions**: Surface winds a gentle 3 km/h — thick atmosphere moves like molten glass. Heat distribution remarkably uniform pole-to-pole.\n**Greenhouse Effect**: Runaway. CO₂ at 96.5% trapping all outgoing infrared.\n**Forecast**: No change. Venus hasn't had a "cool day" in 2 billion years.`,
    `**Venus Weather Report**\n\n**Current Conditions**: Night side at 460 °C — barely cooler than day side. The atmosphere's thermal inertia is staggering.\n**Cloud Top**: −45 °C at 70 km, UV-absorbing dark patches rotating with super-rotation winds.\n**Forecast**: The mysterious UV absorber remains unidentified. Could be microbial? Probably sulfur chemistry.`,
  ],
  mars: [
    `**Mars Weather Report**\n\n**Current Conditions**: A brisk −60 °C with thin CO₂ atmosphere. Dust devils spotted in Jezero crater.\n**Wind**: Light 30 km/h gusts from the northwest.\n**Forecast**: Global dust storm brewing — visibility dropping to 2 km by next week.`,
    `**Mars Weather Report**\n\n**Current Conditions**: −78 °C at Olympus Mons summit. CO₂ frost forming on the caldera rim. Pressure at summit: 0.1 mbar.\n**Wind**: Katabatic downslope winds reaching 60 km/h.\n**Forecast**: Clear skies for the next 3 sols. Perfect conditions for a summit EVA.`,
    `**Mars Weather Report**\n\n**Current Conditions**: Hellas Basin experiencing a warm anomaly at −15 °C. Lowest point on Mars = highest atmospheric pressure = least awful conditions.\n**Dust**: Moderate haze. Tau 0.8.\n**Forecast**: Regional dust storm forming near Noachis Terra. May reach Hellas in 5 sols.`,
    `**Mars Weather Report**\n\n**Current Conditions**: −95 °C at south pole. Dry ice cap expanding as winter deepens. Geysers of CO₂ gas erupting through translucent ice slabs.\n**Atmospheric Pressure**: 6.1 mbar and dropping as CO₂ freezes out.\n**Forecast**: Polar night for another 60 sols. Spectacular CO₂ jet activity expected.`,
    `**Mars Weather Report**\n\n**Current Conditions**: Equatorial midday at a balmy −5 °C. Opportunity's old tracks still visible — no rain to wash them away for millions of years.\n**UV Index**: Extreme. No ozone layer.\n**Forecast**: Blue sunset in 3 hours. Dust particles scatter light forward, creating the famous blue twilight.`,
  ],
  jupiter: [
    `**Jupiter Weather Report**\n\n**Current Conditions**: The Great Red Spot is raging at wind speeds of 640 km/h. Ammonia ice crystals glitter in the upper atmosphere at −145 °C.\n**Wind**: Extreme jet streams exceeding 600 km/h.\n**Forecast**: Storms lasting centuries. Business as usual.`,
    `**Jupiter Weather Report**\n\n**Current Conditions**: −110 °C at cloud tops. A new white oval storm has erupted in the South Equatorial Belt — 5,000 km wide and growing.\n**Lightning**: Massive discharges detected 50 km below cloud deck, 10× more powerful than Earth's.\n**Forecast**: Belt-zone oscillation continuing. Expect color changes in the NEB over the next 6 months.`,
    `**Jupiter Weather Report**\n\n**Current Conditions**: Polar aurora blazing at both poles, driven by Io's volcanic plasma torus. X-ray emissions off the charts.\n**Temperature**: −160 °C at poles, but aurora hotspot reaching 700 °C in the thermosphere.\n**Forecast**: Io volcanic eruption increasing plasma flux. Aurora to intensify for the next 2 weeks.`,
    `**Jupiter Weather Report**\n\n**Current Conditions**: Equatorial zone ammonia clouds at −145 °C. Water clouds detected 80 km below at 20 °C and 5 bar.\n**Wind Shear**: Massive — 180 m/s difference between adjacent bands.\n**Forecast**: The Great Red Spot has shrunk to 1.3× Earth's diameter. Is the king of storms finally dying? Stay tuned.`,
    `**Jupiter Weather Report**\n\n**Current Conditions**: −150 °C in the North Temperate Belt. String-of-pearls white ovals maintaining formation at 23°N latitude.\n**Ammonia**: Depleted in hot spots between cloud bands — Juno's microwave radiometer sees clear down to 100 bar.\n**Forecast**: Stable banding pattern. Next major upheaval event predicted in 15 years based on historical cycle.`,
  ],
  saturn: [
    `**Saturn Weather Report**\n\n**Current Conditions**: −178 °C in the upper clouds. Hexagonal polar vortex holding steady.\n**Wind**: Equatorial winds reaching 1,800 km/h — among the fastest in the solar system.\n**Forecast**: Ring shadow season approaching the northern hemisphere.`,
    `**Saturn Weather Report**\n\n**Current Conditions**: Great White Spot forming in the northern hemisphere — happens roughly every 30 years. Already spanning 30,000 km.\n**Lightning**: 10 billion watts per flash. Thunder rolling through hydrogen atmosphere.\n**Forecast**: Storm will encircle the entire planet within 4 months. Spectacular viewing ahead.`,
    `**Saturn Weather Report**\n\n**Current Conditions**: −185 °C at south pole. Bizarre warm polar vortex creating a hole in the tropopause haze — you can see deeper here than anywhere else.\n**Wind**: Polar jet at 550 km/h, forming tight eyewall structure.\n**Forecast**: Southern winter approaching. Hexagonal north pole vortex now in permanent sunlight.`,
    `**Saturn Weather Report**\n\n**Current Conditions**: Equatorial region at −175 °C. Ammonia and phosphine cloud layers creating the butterscotch color palette.\n**Rings**: Casting dramatic shadows on the cloud tops, creating distinct temperature bands at ring-shadow boundaries.\n**Forecast**: Ring plane crossing for the Sun in 7 years — shadows will vanish briefly as rings go edge-on.`,
    `**Saturn Weather Report**\n\n**Current Conditions**: −140 °C at 10 bar depth. Helium rain predicted to be falling through metallic hydrogen layer deep in the interior.\n**Wind**: 1,650 km/h at equator but dropping to 40 km/h at higher latitudes.\n**Forecast**: Radio emissions from lightning storms pulsing every 10 hours 33 minutes — still our best estimate for Saturn's rotation rate.`,
  ],
  neptune: [
    `**Neptune Weather Report**\n\n**Current Conditions**: −214 °C. Dark spots (anticyclonic storms) are racing across the blue methane atmosphere.\n**Wind**: Supersonic winds at 2,100 km/h.\n**Forecast**: Continued extreme cold — summer lasts 40 Earth-years here, so no warm-up expected soon.`,
    `**Neptune Weather Report**\n\n**Current Conditions**: −218 °C at cloud tops. A new Great Dark Spot detected by Hubble — 13,000 km across at 23°S latitude.\n**Methane Ice**: Cirrus-like clouds of methane ice crystals forming 50 km above main cloud deck.\n**Forecast**: Dark spot drifting equatorward. Expected to dissipate within 2 years, unlike Jupiter's persistent storms.`,
    `**Neptune Weather Report**\n\n**Current Conditions**: −210 °C. Bright companion clouds flanking the dark vortex, rising methane updrafts catching sunlight.\n**Wind**: 580 m/s retrograde equatorial jet — fastest planetary winds ever measured.\n**Forecast**: Southern hemisphere storm season peaking. Internal heat output 2.6× solar input driving vigorous convection.`,
    `**Neptune Weather Report**\n\n**Current Conditions**: −220 °C in the stratosphere. Ethane and acetylene haze layers detected above the methane cloud deck.\n**Aurora**: Faint but present — offset magnetic field creates aurora far from geographic poles.\n**Forecast**: Seasonal changes glacially slow — Neptune has completed only one orbit since its discovery in 1846.`,
    `**Neptune Weather Report**\n\n**Current Conditions**: −215 °C. South polar region experiencing "summer" — slightly elevated methane emission and stratospheric warming (+10 °C).\n**Triton Transit**: Neptune's largest moon casting shadow across cloud tops today.\n**Forecast**: Diamond rain likely falling through the ice giant interior at 7,000 km depth as methane decomposes under extreme pressure.`,
  ],
};

const FACTS = [
  "Saturn's rings are mostly made of chunks of ice and carbonaceous dust. The ring particles range in size from tiny grains to boulders the size of a house.",
  "A day on Venus (243 Earth days) is longer than a year on Venus (225 Earth days). It also rotates backward compared to most planets!",
  "Jupiter's Great Red Spot is a storm that has been raging for at least 350 years and is so large that three Earths could fit inside it.",
  "Neutron stars are so dense that a teaspoon of neutron star material would weigh about 6 billion tons on Earth.",
  "The Sun makes up 99.86% of the total mass of the Solar System.",
  "Olympus Mons on Mars is the tallest volcano in the solar system, standing about 72,000 ft (22 km) — roughly 2.5× the height of Mount Everest.",
  "There are more stars in the observable universe (~200 billion trillion) than grains of sand on all of Earth's beaches.",
  "If you could fly a plane to the Sun, it would take roughly 20 years at 800 km/h.",
  "Enceladus, a moon of Saturn, has geysers that shoot water ice into space — making it one of the best candidates for extraterrestrial life.",
  "The Voyager 1 spacecraft, launched in 1977, is the most distant human-made object — over 24 billion km from Earth and still transmitting.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeather(query: string): string {
  const q = query.toLowerCase();
  for (const [planet, reports] of Object.entries(WEATHER)) {
    if (q.includes(planet)) return pickRandom(reports);
  }
  return pickRandom(WEATHER["mars"]!);
}

function isWeatherQuery(text: string): boolean {
  return /weather|forecast|temperature|cold|hot|storm/i.test(text);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SolarSystemExecutor implements AgentExecutor {
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
    if (isWeatherQuery(userText)) {
      responseText = getWeather(userText);
    } else {
      responseText = `**Space Fact**\n\n${pickRandom(FACTS)}`;
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
