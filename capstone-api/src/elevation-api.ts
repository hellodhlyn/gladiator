export type ElevationResult = {
  elevation: number;
  location: {
    lat: number;
    lng: number;
  };
  resolution: number;
};

export type ElevationResults = {
  status: string;
  results: ElevationResult[];
};

const GOOGLE_API_HOST = "https://maps.googleapis.com";

export async function getElevations(
  locations: { lat: number, lng: number }[],
  apiKey: string,
): Promise<ElevationResults> {
  const reqPath = "/maps/api/elevation/json";
  const reqParams = `key=${apiKey}&locations=${locations.map((c) => `${c.lat},${c.lng}`).join("|")}`;
  const res = await fetch(`${GOOGLE_API_HOST}${reqPath}?${reqParams}`);
  return res.json<ElevationResults>();
}
