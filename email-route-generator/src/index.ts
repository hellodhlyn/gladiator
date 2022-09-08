export interface Env {
	// KVs
	RATE_LIMITS: KVNamespace;

	// Secrets
  CF_ACCOUNT_ID: string;
	CF_ZONE_ID: string;
	CF_AUTH_KEY: string;

	DESTINATION_ADDRESS: string;
}

const CF_API_HOST = "https://api.cloudflare.com";
const EMAIL_EXPIRE_HOURS = 24;
const RATE_LIMIT_HOURS = 24;
const RATE_LIMIT_COUNT = 1;
const DURATION_HOUR = 60 * 60 * 1000;

async function generateAddress(request: Request, env: Env): Promise<Response> {
	const address = `contact_${Math.random().toString(36).slice(-6)}@lynlab.co.kr`;
	const expireAt = new Date((new Date()).getTime() + EMAIL_EXPIRE_HOURS * DURATION_HOUR);
	const generationInfo = {
		ip: request.headers.get("CF-Connecting-IP"),
		exp: expireAt.getTime(),
	};

	const path = `${CF_API_HOST}/client/v4/zones/${env.CF_ZONE_ID}/email/routing/rules`;
	const res = await fetch(path, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${env.CF_AUTH_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			matchers: [{ type: "literal", field: "to", value: address }],
			actions: [{ type: "forward", value: [ env.DESTINATION_ADDRESS ] }],
			name: JSON.stringify(generationInfo),
		}),
	});

	if (res.status >= 300) {
		console.log(await res.text());
		return new Response("internal error", { status: 500 });
	}

	const result = {
		address: address,
		expireAt: expireAt.getTime(),
	};
	return new Response(JSON.stringify(result), {
		headers: {
			"Content-Type": "application/json",
		},
	});
}

async function rateLimit(request: Request, env: Env): Promise<boolean> {
	const ip = request.headers.get("CF-Connecting-IP");
	const rateLimitKey = `email-route-generator:ip:${ip}`;
	const requests = (JSON.parse((await env.RATE_LIMITS.get(rateLimitKey)) || "[]") as number[])
		.filter((timestamp) => timestamp > (new Date().getTime() - RATE_LIMIT_HOURS * DURATION_HOUR));
	if (requests.length >= RATE_LIMIT_COUNT) {
		return false;
	}

	await env.RATE_LIMITS.put(rateLimitKey, JSON.stringify([...requests, new Date().getTime()]));
	return true;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (request.method !== "POST" || pathname !== "/generate") {
			return new Response("not found", { status: 404 });
		}
		if (!await rateLimit(request, env)) {
			return new Response("too many requests", { status: 429 });
		}

		return generateAddress(request, env);
	},
};
