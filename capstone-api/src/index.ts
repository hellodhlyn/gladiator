import { ElevationResult, getElevations } from "./elevation-api";

export interface Env {
	// KVs
	CAPSTONE_DATA: KVNamespace;

	// Secrets
	GOOGLE_API_KEY: string;
}

type Building = {
	name: string;
	coordinates: {
		lat: number;
		lng: number;
		height: number | null;
	}[];
};

const BUILDINGS_DATA_KEY = "capstone.buildings";
const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Max-Age": "86400",
};

function roundCoord(coord: number): number {
	return Math.round(coord * 100000);
}

async function fillHeights(originalData: Building[], env: Env): Promise<Building[]> {
	const coordsToFill = originalData.flatMap((building) => building.coordinates.filter((coord) => !coord.height));
	let elevations: ElevationResult[] = [];
	if (coordsToFill.length > 0) {
		elevations = (await getElevations(coordsToFill, env.GOOGLE_API_KEY)).results;
	}

	return originalData.map((building) => ({
		name: building.name,
		coordinates: building.coordinates.map((coord) => {
			if (coord.height) {
				return coord;
			}
			return {
				lat: coord.lat,
				lng: coord.lng,
				height: elevations.find((e) => (
					roundCoord(e.location.lat) === roundCoord(coord.lat) &&
					  roundCoord(e.location.lng) === roundCoord(coord.lng))
				)?.elevation || null,
			};
		}),
	}));
}

async function storeBuildings(request: Request, env: Env): Promise<Response> {
	if (!request.body) {
		return new Response(null, { status: 400 });
	}
	const buildings = await fillHeights(await request.json<Building[]>(), env);
	await env.CAPSTONE_DATA.put(BUILDINGS_DATA_KEY, JSON.stringify(buildings));
	return new Response(JSON.stringify(buildings), {
		headers: {
			...CORS_HEADERS,
			"Content-Type": "application/json",
		},
	});
}

async function getBuildings(request: Request, env: Env): Promise<Response> {
	return new Response(await env.CAPSTONE_DATA.get(BUILDINGS_DATA_KEY), {
		headers: {
			...CORS_HEADERS,
			"Content-Type": "application/json",
		},
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: CORS_HEADERS });
		} else if (request.method === "POST" && pathname === "/buildings") {
			return storeBuildings(request, env);
		} else if (request.method === "GET" && pathname === "/buildings.json") {
			return getBuildings(request, env);
		} else {
			return new Response(null, { status: 400 });
		}
	},
};
