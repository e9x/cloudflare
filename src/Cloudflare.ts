import fetch, { Request } from 'node-fetch';

export function formatError({ code, message, error_chain }: CloudflareError) {
	const result = [`Error ${code}: ${message}`];

	if (error_chain)
		for (const error of error_chain)
			result.push(
				formatError(error)
					.split('\n')
					.map((line) => `\t${line}`)
					.join('\n')
			);

	return result.join('\n');
}

export interface CloudflareError {
	code: string;
	message: string;
	error_chain: CloudflareError[];
}

export interface CloudflareResponse<T> {
	success: boolean;
	result: T;
	errors: CloudflareError[];
	messages: string[];
}

function resolveClient(url: string) {
	return new URL(
		url.toString(),
		'https://api.cloudflare.com/client/'
	).toString();
}

export default class Cloudflare {
	private key: string;
	private email: string;
	constructor({ key, email }: { key: string; email: string }) {
		this.key = key;
		this.email = email;
	}
	/**
	 * Send a GET request
	 */
	get<T>(api: string) {
		return this.fetch<T>(new Request(resolveClient(api)));
	}
	/**
	 * Send a DELETE request
	 */
	delete<T>(api: string) {
		return this.fetch<T>(new Request(resolveClient(api), { method: 'DELETE' }));
	}
	/**
	 * Send a POST request
	 */
	post<T>(api: string, body: unknown) {
		return this.upload<T>(api, 'POST', body);
	}
	/**
	 * Send a PATCH request
	 */
	patch<T>(api: string, body: unknown) {
		return this.upload<T>(api, 'PATCH', body);
	}
	/**
	 * Send a PUT request
	 */
	put<T>(api: string, body: unknown) {
		return this.upload<T>(api, 'PUT', body);
	}
	private upload<T>(api: string, method: RequestInit['method'], body: unknown) {
		return this.fetch<T>(
			new Request(resolveClient(api), {
				method,
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify(body),
			})
		);
	}
	private async fetch<T>(request: Request) {
		request.headers.set('x-auth-key', this.key);
		request.headers.set('x-auth-email', this.email);

		const res = await fetch(request);

		const { success, result, errors, messages } = <CloudflareResponse<T>>(
			await res.json()
		);

		for (const message of messages) console.warn(message);

		if (!success) throw new Error('\n' + errors.map(formatError).join('\n'));

		return result;
	}
}
