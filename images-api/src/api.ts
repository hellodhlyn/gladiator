
export async function requestGet(path: string): Promise<Response> {
  return request("GET", path);
}

export async function requestPost(path: string, body: object): Promise<Response> {
  return request("POST", path, body);
}

async function request(method: string, path: string, body?: object): Promise<Response> {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}`;
  const url = `${endpoint}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${CF_AUTH_KEY}`,
    },
  };

  if (body) {
    const formData = new FormData();
    Object.entries(body).forEach((entry) => { formData.set(entry[0], entry[1]) });
    init.body = formData;
  }

  return fetch(url, init);
}
