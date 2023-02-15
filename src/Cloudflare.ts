import fetch, { Request } from "node-fetch";

export function formatError({ code, message, error_chain }: CloudflareError) {
  const result = [`Error ${code}: ${message}`];

  if (error_chain)
    for (const error of error_chain)
      result.push(
        formatError(error)
          .split("\n")
          .map((line) => `\t${line}`)
          .join("\n")
      );

  return result.join("\n");
}

export interface CloudflareError {
  code: string;
  message: string;
  error_chain: CloudflareError[];
}

export interface CloudflareResponse<T> {
  success: boolean;
  result: T;
  errors: CloudflareError[] | null;
  messages: string[] | null;
}

function resolveClient(url: string) {
  return new URL(
    url.toString(),
    "https://api.cloudflare.com/client/"
  ).toString();
}

function isCloudflareResponse<T>(body: unknown): body is CloudflareResponse<T> {
  const b = body as Partial<CloudflareResponse<T>>;

  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    typeof body.success === "boolean" &&
    (b.errors === null || Array.isArray(b.errors)) &&
    (b.messages === null ||
      (Array.isArray(b.messages) &&
        b.messages.every((e) => typeof e === "string")))
  );
}

/**
 * Throw error with text
 */
function parseCloudflareJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    (err as SyntaxError & { text?: string }).text = text;
    throw err;
  }
}

export default class Cloudflare {
  private key: string;
  private email: string;
  constructor({ key, email }: { key: string; email: string }) {
    this.key = key;
    this.email = email;
  }
  /** Send a GET request */
  get<ResponseType>(api: string) {
    return this.fetch<ResponseType>(new Request(resolveClient(api)));
  }
  /** Send a DELETE request */
  delete<ResponseType>(api: string) {
    return this.fetch<ResponseType>(
      new Request(resolveClient(api), { method: "DELETE" })
    );
  }
  /** Send a POST request */
  post<ResponseType, BodyType = unknown>(api: string, body?: BodyType) {
    return this.upload<ResponseType>(api, "POST", body);
  }
  /** Send a PATCH request */
  patch<ResponseType, BodyType = unknown>(api: string, body?: BodyType) {
    return this.upload<ResponseType>(api, "PATCH", body);
  }
  /** Send a PUT request */
  put<ResponseType, BodyType = unknown>(api: string, body?: BodyType) {
    return this.upload<ResponseType>(api, "PUT", body);
  }
  /**
   * @internal
   */
  private upload<ResponseType>(
    api: string,
    method: RequestInit["method"],
    body?: unknown
  ) {
    return this.fetch<ResponseType>(
      body
        ? new Request(resolveClient(api), {
            method,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(body),
          })
        : new Request(resolveClient(api), {
            method,
          })
    );
  }
  /**
   * @internal
   */
  private async fetch<T>(request: Request) {
    request.headers.set("x-auth-key", this.key);
    request.headers.set("x-auth-email", this.email);

    const res = await fetch(request);

    const text = await res.text();

    const body = parseCloudflareJSON(text);

    if (!isCloudflareResponse<T>(body))
      throw new Error(
        `Failure processing response. Got ${res.status} ${res.statusText}`
      );

    if (body.messages)
      for (const message of body.messages) console.warn(message);

    if (!body.success)
      throw new Error(
        body.errors
          ? `Cloudflare error:\n${body.errors.map(formatError).join("\n")}`
          : "Unknown Cloudflare error"
      );

    return body.result;
  }
}
