/**
 * Location profiles for the demo provider.
 *
 * Coordinates are the real city centres so distance sorting feels natural; every
 * business record built from them is fictional sample data.
 */

export interface CityProfile {
  key: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  /** National dialling code, e.g. "+1". */
  dialCode: string;
  /** Area / mobile prefix used with the demo 555-01xx style numbers. */
  areaCode: string;
  /** Demo numbers use reserved fictional ranges (US 555-0100…0199, NG 555-01xx). */
  fictionalNumberRange: [number, number];
  streets: string[];
  neighbourhoods: string[];
  postal: (rngValue: number) => string;
  aliases: string[];
}

const usPostal = (v: number) => String(43000 + Math.floor(v * 900)).padStart(5, "0");
const ukPostal = (v: number) => `${["EC1", "N1", "SW9", "E8", "SE15"][Math.floor(v * 5) % 5]} ${Math.floor(1 + v * 9)}${["AB", "DP", "QT", "JR", "HN"][Math.floor(v * 5) % 5]}`;
const ngPostal = (v: number) => String(100001 + Math.floor(v * 90000));

export const CITY_PROFILES: CityProfile[] = [
  {
    key: "columbus-oh",
    city: "Columbus",
    region: "Ohio",
    country: "United States",
    countryCode: "US",
    latitude: 39.9612,
    longitude: -82.9988,
    dialCode: "+1",
    areaCode: "614",
    fictionalNumberRange: [100, 199],
    streets: [
      "N High St",
      "E Main St",
      "W Broad St",
      "Polaris Pkwy",
      "S Hamilton Rd",
      "Bethel Rd",
      "E Dublin-Granville Rd",
      "Cleveland Ave",
      "Sawmill Rd",
      "W 5th Ave",
    ],
    neighbourhoods: ["Short North", "German Village", "Clintonville", "Grandview", "Easton", "Franklinton"],
    postal: usPostal,
    aliases: ["columbus", "columbus ohio", "columbus, ohio", "columbus oh", "cbus", "43085", "43215"],
  },
  {
    key: "austin-tx",
    city: "Austin",
    region: "Texas",
    country: "United States",
    countryCode: "US",
    latitude: 30.2672,
    longitude: -97.7431,
    dialCode: "+1",
    areaCode: "512",
    fictionalNumberRange: [100, 199],
    streets: ["S Congress Ave", "E 6th St", "Burnet Rd", "Lamar Blvd", "W Anderson Ln", "Manor Rd", "Slaughter Ln"],
    neighbourhoods: ["South Congress", "East Austin", "Mueller", "Zilker", "Hyde Park"],
    postal: usPostal,
    aliases: ["austin", "austin texas", "austin, texas", "austin tx", "atx"],
  },
  {
    key: "phoenix-az",
    city: "Phoenix",
    region: "Arizona",
    country: "United States",
    countryCode: "US",
    latitude: 33.4484,
    longitude: -112.074,
    dialCode: "+1",
    areaCode: "602",
    fictionalNumberRange: [100, 199],
    streets: ["N 7th St", "E Camelback Rd", "W Thomas Rd", "N Central Ave", "E Indian School Rd", "S Mill Ave"],
    neighbourhoods: ["Arcadia", "Roosevelt Row", "Melrose", "Biltmore", "Ahwatukee"],
    postal: usPostal,
    aliases: ["phoenix", "phoenix arizona", "phoenix, arizona", "phoenix az"],
  },
  {
    key: "denver-co",
    city: "Denver",
    region: "Colorado",
    country: "United States",
    countryCode: "US",
    latitude: 39.7392,
    longitude: -104.9903,
    dialCode: "+1",
    areaCode: "303",
    fictionalNumberRange: [100, 199],
    streets: ["S Broadway", "E Colfax Ave", "Larimer St", "S Federal Blvd", "W 38th Ave", "Tejon St"],
    neighbourhoods: ["RiNo", "Capitol Hill", "LoHi", "Baker", "Highland"],
    postal: usPostal,
    aliases: ["denver", "denver colorado", "denver, colorado", "denver co"],
  },
  {
    key: "charlotte-nc",
    city: "Charlotte",
    region: "North Carolina",
    country: "United States",
    countryCode: "US",
    latitude: 35.2271,
    longitude: -80.8431,
    dialCode: "+1",
    areaCode: "704",
    fictionalNumberRange: [100, 199],
    streets: ["South Blvd", "E 7th St", "Park Rd", "N Tryon St", "Providence Rd", "Central Ave"],
    neighbourhoods: ["NoDa", "South End", "Plaza Midwood", "Dilworth", "Uptown"],
    postal: usPostal,
    aliases: ["charlotte", "charlotte north carolina", "charlotte, north carolina", "charlotte nc"],
  },
  {
    key: "nashville-tn",
    city: "Nashville",
    region: "Tennessee",
    country: "United States",
    countryCode: "US",
    latitude: 36.1627,
    longitude: -86.7816,
    dialCode: "+1",
    areaCode: "615",
    fictionalNumberRange: [100, 199],
    streets: ["Gallatin Ave", "12th Ave S", "Charlotte Ave", "Nolensville Pike", "Murfreesboro Pike"],
    neighbourhoods: ["The Gulch", "East Nashville", "Berry Hill", "Germantown", "12 South"],
    postal: usPostal,
    aliases: ["nashville", "nashville tennessee", "nashville, tennessee", "nashville tn"],
  },
  {
    key: "tampa-fl",
    city: "Tampa",
    region: "Florida",
    country: "United States",
    countryCode: "US",
    latitude: 27.9506,
    longitude: -82.4572,
    dialCode: "+1",
    areaCode: "813",
    fictionalNumberRange: [100, 199],
    streets: ["N Florida Ave", "W Kennedy Blvd", "S Howard Ave", "E Fowler Ave", "Bayshore Blvd"],
    neighbourhoods: ["Hyde Park", "Ybor City", "Seminole Heights", "Westshore", "Channelside"],
    postal: usPostal,
    aliases: ["tampa", "tampa florida", "tampa, florida", "tampa fl"],
  },
  {
    key: "lagos-ng",
    city: "Lagos",
    region: "Lagos State",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 6.5244,
    longitude: 3.3792,
    dialCode: "+234",
    areaCode: "803",
    fictionalNumberRange: [100, 199],
    streets: ["Admiralty Way", "Awolowo Road", "Ozumba Mbadiwe Ave", "Bode Thomas St", "Allen Avenue", "Marina"],
    neighbourhoods: ["Lekki Phase 1", "Victoria Island", "Ikeja GRA", "Yaba", "Surulere"],
    postal: ngPostal,
    aliases: ["lagos", "lagos nigeria", "lagos, nigeria", "lekki", "victoria island", "ikeja"],
  },
  {
    key: "port-harcourt-ng",
    city: "Port Harcourt",
    region: "Rivers State",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 4.8156,
    longitude: 7.0498,
    dialCode: "+234",
    areaCode: "808",
    fictionalNumberRange: [100, 199],
    streets: ["Aba Road", "Ada George Road", "Olusegun Obasanjo Way", "Peter Odili Road", "Woji Road", "Trans Amadi"],
    neighbourhoods: ["GRA Phase 2", "Woji", "Rumuokoro", "Trans Amadi", "Old GRA"],
    postal: ngPostal,
    aliases: ["port harcourt", "port harcourt rivers state", "ph", "rumuokoro", "woji"],
  },
  {
    key: "abuja-ng",
    city: "Abuja",
    region: "FCT",
    country: "Nigeria",
    countryCode: "NG",
    latitude: 9.0765,
    longitude: 7.3986,
    dialCode: "+234",
    areaCode: "806",
    fictionalNumberRange: [100, 199],
    streets: ["Aminu Kano Cres", "Ademola Adetokunbo Cres", "Gana St", "Shehu Shagari Way", "Ahmadu Bello Way"],
    neighbourhoods: ["Wuse 2", "Maitama", "Garki", "Gwarinpa", "Asokoro"],
    postal: ngPostal,
    aliases: ["abuja", "abuja nigeria", "fct", "wuse", "maitama"],
  },
  {
    key: "london-uk",
    city: "London",
    region: "England",
    country: "United Kingdom",
    countryCode: "GB",
    latitude: 51.5072,
    longitude: -0.1276,
    dialCode: "+44",
    areaCode: "20",
    fictionalNumberRange: [100, 199],
    streets: ["High Road", "Brick Lane", "Coldharbour Lane", "Kingsland Road", "Upper Street", "Rye Lane"],
    neighbourhoods: ["Shoreditch", "Camden", "Brixton", "Islington", "Hackney"],
    postal: ukPostal,
    aliases: ["london", "london uk", "london, uk", "shoreditch", "camden"],
  },
  {
    key: "toronto-ca",
    city: "Toronto",
    region: "Ontario",
    country: "Canada",
    countryCode: "CA",
    latitude: 43.6532,
    longitude: -79.3832,
    dialCode: "+1",
    areaCode: "416",
    fictionalNumberRange: [100, 199],
    streets: ["Queen St W", "Danforth Ave", "Bloor St W", "Yonge St", "Dundas St W", "Eglinton Ave E"],
    neighbourhoods: ["The Annex", "Leslieville", "Kensington", "Junction", "Parkdale"],
    postal: (v) => `M${Math.floor(v * 5) + 4}${["B", "K", "R", "V"][Math.floor(v * 4) % 4]} 2${["A", "C", "G", "L"][Math.floor(v * 4) % 4]}`,
    aliases: ["toronto", "toronto ontario", "toronto, ontario", "toronto on"],
  },
  {
    key: "accra-gh",
    city: "Accra",
    region: "Greater Accra",
    country: "Ghana",
    countryCode: "GH",
    latitude: 5.6037,
    longitude: -0.187,
    dialCode: "+233",
    areaCode: "24",
    fictionalNumberRange: [100, 199],
    streets: ["Oxford St", "Ring Road Central", "Spintex Road", "Liberation Road", "Kwame Nkrumah Ave"],
    neighbourhoods: ["Osu", "East Legon", "Labone", "Airport Residential", "Cantonments"],
    postal: (v) => `GA-${100 + Math.floor(v * 800)}-${1000 + Math.floor(v * 8000)}`,
    aliases: ["accra", "accra ghana", "east legon", "osu"],
  },
  {
    key: "nairobi-ke",
    city: "Nairobi",
    region: "Nairobi County",
    country: "Kenya",
    countryCode: "KE",
    latitude: -1.2921,
    longitude: 36.8219,
    dialCode: "+254",
    areaCode: "712",
    fictionalNumberRange: [100, 199],
    streets: ["Ngong Road", "Mombasa Road", "Kimathi Street", "Waiyaki Way", "Argwings Kodhek Rd"],
    neighbourhoods: ["Westlands", "Kilimani", "Karen", "Lavington", "Parklands"],
    postal: (v) => String(100 + Math.floor(v * 900)),
    aliases: ["nairobi", "nairobi kenya", "westlands", "kilimani"],
  },
];

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s,]/g, "").replace(/\s+/g, " ").trim();
}

/** Resolve a free-text location such as "Columbus, Ohio" or "lekki". */
export function findCity(input: string): CityProfile | null {
  const q = normalise(input);
  if (!q) return null;
  for (const city of CITY_PROFILES) {
    if (city.aliases.some((a) => normalise(a) === q)) return city;
  }
  for (const city of CITY_PROFILES) {
    if (city.aliases.some((a) => q.includes(normalise(a)) || normalise(a).includes(q))) return city;
  }
  for (const city of CITY_PROFILES) {
    if (normalise(city.city) === q || q.includes(normalise(city.city))) return city;
  }
  return null;
}

/** Build an ad-hoc profile when the location is unknown to the demo dataset. */
export function fallbackCity(input: string): CityProfile {
  const cleaned = input.trim().replace(/\s+/g, " ");
  const [cityPart, regionPart] = cleaned.split(",").map((s) => s.trim());
  const city = cityPart || cleaned || "Your area";
  return {
    key: `custom-${city.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    city: city.charAt(0).toUpperCase() + city.slice(1),
    region: regionPart ?? "",
    country: "Custom area",
    countryCode: "XX",
    latitude: 39.5,
    longitude: -98.35,
    dialCode: "+1",
    areaCode: "555",
    fictionalNumberRange: [100, 199],
    streets: [
      "Main St",
      "Oak Ave",
      "Market St",
      "Park Rd",
      "High St",
      "Station Rd",
      "Mill Lane",
      "Church St",
    ],
    neighbourhoods: ["Downtown", "North End", "Riverside", "Old Town", "Uptown"],
    postal: () => "00000",
    aliases: [],
  };
}

export const CITY_LIST = CITY_PROFILES.map((c) => ({
  key: c.key,
  label: c.region ? `${c.city}, ${c.region}` : c.city,
  country: c.country,
}));
