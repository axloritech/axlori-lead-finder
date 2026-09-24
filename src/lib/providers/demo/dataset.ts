import { createRng, hashString, pick, round, slugify } from "@/lib/utils";
import type { Business, OpeningHours } from "@/lib/types";
import type { CityProfile } from "@/lib/providers/demo/cities";
import type { CategoryBlueprint } from "@/lib/providers/demo/categories";
import { demoBusinessId } from "@/lib/providers/demo/ids";

/**
 * Deterministic demo dataset generator.
 *
 * Given a category + city it produces a stable list of fictional businesses.
 * The same query always yields the same records, so the demo feels like a real
 * dataset rather than a slot machine. Nothing here should ever be mistaken for
 * real data — see `DEMO_PROVENANCE` in `src/lib/providers/demo/index.ts`.
 */

/** Relative search volume used to size demo result sets. */
const CATEGORY_VOLUME: Record<string, number> = {
  restaurant: 1.3,
  cafe: 1.1,
  barber: 1,
  hair_salon: 1,
  lagos: 1,
  real_estate: 0.85,
  dental: 0.72,
  nail_salon: 0.7,
  gym: 0.7,
  bakery: 0.68,
  medical_clinic: 0.6,
  spa: 0.58,
  auto_repair: 0.58,
  law_firm: 0.56,
  accountant: 0.52,
  hotel: 0.5,
  cleaning: 0.5,
  landscaping: 0.5,
  electrician: 0.5,
  plumbing: 0.5,
  pet_grooming: 0.48,
  photography: 0.46,
  yoga: 0.42,
  tattoo: 0.4,
  florist: 0.4,
  car_dealership: 0.36,
  event_venue: 0.3,
  general: 0.8,
};

const CITY_VOLUME: Record<string, number> = {
  "london-uk": 1.4,
  "lagos-ng": 1.32,
  "columbus-oh": 1.2,
  "toronto-ca": 1.16,
  "austin-tx": 1.14,
  "phoenix-az": 1.08,
  "denver-co": 1,
  "charlotte-nc": 1,
  "port-harcourt-ng": 1,
  "nashville-tn": 0.96,
  "tampa-fl": 0.94,
  "abuja-ng": 0.9,
  "nairobi-ke": 0.82,
  "accra-gh": 0.76,
};

const PHOTO_POOL = [
  "barber-1",
  "barber-2",
  "salon-1",
  "salon-2",
  "restaurant-1",
  "restaurant-2",
  "cafe-1",
  "hotel-1",
  "gym-1",
  "clinic-1",
  "shop-1",
  "shop-2",
];

const DEMO_BASE_COUNT = 205;

function buildHours(rng: () => number): OpeningHours[] {
  const weekdayOpen = pick(rng, ["08:00", "08:30", "09:00", "09:30", "10:00"]);
  const weekdayClose = pick(rng, ["17:00", "18:00", "19:00", "20:00", "21:00"]);
  const saturdayOpen = pick(rng, ["08:00", "09:00", "10:00"]);
  const saturdayClose = pick(rng, ["15:00", "16:00", "18:00", "20:00"]);
  const closedSunday = rng() < 0.62;
  const closedMonday = !closedSunday && rng() < 0.18;

  return [0, 1, 2, 3, 4, 5, 6].map((day) => {
    if (day === 0) {
      return closedSunday
        ? { day, open: null, close: null, closed: true }
        : { day, open: "10:00", close: "16:00", closed: false };
    }
    if (day === 1 && closedMonday) return { day, open: null, close: null, closed: true };
    if (day === 6) return { day, open: saturdayOpen, close: saturdayClose, closed: false };
    return { day, open: weekdayOpen, close: weekdayClose, closed: false };
  });
}

function buildWebsite(rng: () => number, name: string, city: CityProfile) {
  const base = slugify(name).slice(0, 28) || "business";
  const suffix = pick(rng, ["", "", "", `-${slugify(city.city)}`, "co", "group"]);
  const tld = pick(rng, [".com", ".com", ".com", ".com", ".co", ".shop", ".biz", ".studio", ".net"]);
  const host = `${base}${suffix}`;
  // A small slice of demo businesses use a social page as their only web presence.
  if (rng() < 0.12) return `https://www.facebook.com/${host.replace(/-/g, "")}`;
  return `https://${host}${tld}`;
}

function buildEmail(
  rng: () => number,
  blueprint: CategoryBlueprint,
  name: string,
  website: string | null,
) {
  if (!website && rng() > 0.55) return null;
  if (rng() > 0.62) return null; // not every business publishes an email
  const prefix = pick(rng, blueprint.emailPrefixes);
  let domain: string;
  if (website) {
    try {
      const url = new URL(website);
      domain = url.hostname.replace(/^www\./, "");
      if (domain.includes("facebook.com")) {
        domain = pick(rng, ["gmail.com", "yahoo.com", "outlook.com"]);
      }
    } catch {
      domain = "gmail.com";
    }
  } else {
    domain = `${slugify(name).replace(/-/g, "").slice(0, 18)}.${pick(rng, ["gmail.com", "gmail.com", "yahoo.com", "outlook.com"])}`;
    return `${prefix}@${domain}`;
  }
  return `${prefix}@${domain}`;
}

function buildPhone(rng: () => number, city: CityProfile) {
  if (rng() > 0.86) return null; // some listings have no public phone number
  const [min, max] = city.fictionalNumberRange;
  const line = String(Math.floor(min + rng() * (max - min + 1))).padStart(4, "0");
  const isMobileRange = city.countryCode === "NG" || city.countryCode === "GH" || city.countryCode === "KE";
  const block = isMobileRange ? "555" : "555";
  return `${city.dialCode} ${city.areaCode} ${block} ${line}`.replace(/\s+/g, " ").trim();
}

export interface GenerateOptions {
  blueprint: CategoryBlueprint;
  city: CityProfile;
  radiusMiles: number;
}

/** Deterministically generate the demo dataset for a category + location pair. */
export function generateDataset({ blueprint, city, radiusMiles }: GenerateOptions): Business[] {
  const seedKey = `${blueprint.id}::${city.key}`;
  const volume = CATEGORY_VOLUME[blueprint.id] ?? 0.8;
  const cityVolume = CITY_VOLUME[city.key] ?? 0.9;
  const jitterRng = createRng(`${seedKey}::size`);
  const count = Math.max(
    18,
    Math.round(DEMO_BASE_COUNT * volume * cityVolume * (0.88 + jitterRng() * 0.26)),
  );

  const usedNames = new Set<string>();
  const businesses: Business[] = [];

  for (let i = 0; i < count; i += 1) {
    const rowRng = createRng(hashString(`${seedKey}::${i}`));

    // ---- Name (unique inside the dataset) ----
    let name = "";
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const head = pick(rowRng, blueprint.nameHeads);
      const tail = pick(rowRng, blueprint.nameTails);
      const candidate =
        attempt > 10 && rowRng() < 0.5
          ? `${head} ${pick(rowRng, city.neighbourhoods)} ${tail}`
          : `${head} ${tail}`;
      if (!usedNames.has(candidate)) {
        name = candidate;
        break;
      }
    }
    if (!name) {
      name = `${pick(rowRng, blueprint.nameHeads)} ${pick(rowRng, blueprint.nameTails)} ${i + 1}`;
    }
    usedNames.add(name);

    // ---- Geography ----
    const neighbourhood = pick(rowRng, city.neighbourhoods);
    const street = pick(rowRng, city.streets);
    const streetNumber = 100 + Math.floor(rowRng() * 8900);

    // Distribute within the search radius (sqrt keeps it area-uniform).
    const distance = round(Math.sqrt(rowRng()) * radiusMiles * 0.97, 1);
    const bearing = rowRng() * Math.PI * 2;
    const degPerMileLat = 1 / 69;
    const degPerMileLon = 1 / (69 * Math.max(0.2, Math.cos((city.latitude * Math.PI) / 180)));
    const latitude = city.latitude + Math.cos(bearing) * distance * degPerMileLat;
    const longitude = city.longitude + Math.sin(bearing) * distance * degPerMileLon;

    // ---- Web presence ----
    const hasWebsite = rowRng() < blueprint.websiteChance;
    const website = hasWebsite ? buildWebsite(rowRng, name, city) : null;
    const phone = buildPhone(rowRng, city);
    const email = buildEmail(rowRng, blueprint, name, website);
    const isMobileFirst = ["barber", "hair_salon", "nail_salon", "tattoo", "photography", "cleaning"].includes(
      blueprint.id,
    );
    const whatsappAvailable = Boolean(phone) && rowRng() < (isMobileFirst ? 0.62 : 0.34);

    // ---- Ratings ----
    const ratingSpread = (rowRng() + rowRng() + rowRng()) / 3; // ~normal
    const rating = round(Math.min(5, Math.max(3.1, blueprint.avgRating - 0.55 + ratingSpread * 1.05)), 1);
    const reviewCount = Math.floor(4 + rowRng() ** 2.2 * 780);

    // ---- Profile detail ----
    const specialties = blueprint.specialties;
    const pickN = (n: number) => {
      const pool = [...specialties];
      const out: string[] = [];
      while (pool.length && out.length < n) out.push(pool.splice(Math.floor(rowRng() * pool.length), 1)[0]);
      return out;
    };
    const [s1, s2, s3] = pickN(3).concat(["quality service", "friendly staff"]);
    const descriptionTemplate = pick(rowRng, blueprint.descriptionTemplates);
    const description = descriptionTemplate
      .replace(/{name}/g, name)
      .replace(/{category}/g, blueprint.label.toLowerCase())
      .replace(/{city}/g, city.city)
      .replace(/{years}/g, String(4 + Math.floor(rowRng() * 22)))
      .replace(/{s1}/g, s1)
      .replace(/{s2}/g, s2)
      .replace(/{s3}/g, s3);

    const updatedDaysAgo = Math.floor(rowRng() * 400);
    const providerUpdatedAt = new Date(Date.now() - updatedDaysAgo * 86400000).toISOString();

    const social = website
      ? {
          facebook: rowRng() < 0.55 ? `https://www.facebook.com/${slugify(name).replace(/-/g, "")}` : undefined,
          instagram: rowRng() < 0.6 ? `https://www.instagram.com/${slugify(name).replace(/-/g, "")}` : undefined,
        }
      : {
          facebook: undefined,
          instagram: rowRng() < 0.25 ? `https://www.instagram.com/${slugify(name).replace(/-/g, "")}` : undefined,
        };

    businesses.push({
      id: demoBusinessId({
        blueprintId: blueprint.id,
        categoryTerm: blueprint.label,
        cityKey: city.key,
        radiusMiles,
        index: i,
      }),
      name,
      category: blueprint.label,
      categories: [blueprint.label, ...(rowRng() < 0.3 ? [neighbourhood] : [])],
      location: {
        city: city.city,
        region: city.region,
        country: city.country,
        postalCode: city.postal(rowRng()),
        formatted: `${streetNumber} ${street}, ${neighbourhood}, ${city.city}${city.region ? `, ${city.region}` : ""}`,
        latitude: round(latitude, 5),
        longitude: round(longitude, 5),
      },
      distanceMiles: distance,
      providerUpdatedAt,
      phone,
      whatsappAvailable,
      email,
      website,
      rating,
      reviewCount,
      priceLevel: Math.round(blueprint.priceLevel[0] + rowRng() * (blueprint.priceLevel[1] - blueprint.priceLevel[0])),
      description,
      hours: buildHours(rowRng),
      photoUrl: `demo://${pick(rowRng, PHOTO_POOL)}`,
      logoUrl: null,
      social,
      websiteStatus: website ? "has_website" : "no_website",
      provenance: {
        provider: "demo",
        providerLabel: "Axlori demo dataset",
        kind: "demo",
        verifiedListing: rowRng() < 0.58,
        retrievedAt: new Date().toISOString(),
        notes: "Fictional sample record used to demonstrate the product without a live provider.",
      },
    });
  }

  return businesses;
}

const cache = new Map<string, Business[]>();
/** Global id → business index so detail pages resolve instantly after a search. */
const datasetIndex = new Map<string, Business>();
/** Cities that have been generated in this process, including ad-hoc locations. */
const cityIndex = new Map<string, CityProfile>();

export function getCachedDataset(options: GenerateOptions): Business[] {
  const key = `${options.blueprint.id}::${options.city.key}::${Math.round(options.radiusMiles)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const generated = generateDataset(options);
  cityIndex.set(options.city.key, options.city);
  for (const business of generated) {
    if (!datasetIndex.has(business.id)) datasetIndex.set(business.id, business);
  }
  cache.set(key, generated);
  return generated;
}

export function findBusinessById(id: string): Business | null {
  return datasetIndex.get(id) ?? null;
}

/** City profile registered by an earlier generation (covers ad-hoc locations). */
export function findCachedCity(key: string): CityProfile | null {
  return cityIndex.get(key) ?? null;
}
