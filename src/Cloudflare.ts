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
	get<T>(url: string) {
		return this.fetch<T>(new Request(resolveClient(url)));
	}
	delete<T>(url: string) {
		return this.fetch<T>(new Request(url, { method: 'DELETE' }));
	}
	post<T>(url: string, body: unknown) {
		return this.upload<T>(url, 'POST', body);
	}
	patch<T>(url: string, body: unknown) {
		return this.upload<T>(url, 'PATCH', body);
	}
	put<T>(url: string, body: unknown) {
		return this.upload<T>(url, 'PUT', body);
	}
	private upload<T>(url: string, method: RequestInit['method'], body: unknown) {
		return this.fetch<T>(
			new Request(resolveClient(url), {
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
