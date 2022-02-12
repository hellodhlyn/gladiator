import { generateUploadUrl, listAllImages } from "./controllers";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

const responseInit: ResponseInit = {
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
};

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);

  // GET /v1/images
  if (pathname === "/v1/images" && request.method === "GET") {
    return new Response(JSON.stringify(await listAllImages()), responseInit);
  }

  // POST /v1/images/upload-url
  else if (pathname === "/v1/images/upload-url" && request.method === "POST") {
    try {
      return new Response(JSON.stringify(await generateUploadUrl(request)), responseInit);
    } catch (e) {
      return new Response(e.message, { status: 400 });
    }
  }

  // GET /ping
  else if (pathname === "/ping") {
    return new Response("pong");
  }
  return new Response("not found", { status: 404 });
}
