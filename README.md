# Cloudflare

<a href="https://www.npmjs.com/package/@e9x/cloudflare"><img src="https://img.shields.io/npm/v/@e9x/cloudflare.svg?maxAge=3600" alt="npm version" /></a>

This package allows you to easily work with Cloudflare APIs.

Although basic, typedefs are important for reliability and understanding of what a client is doing.

This library is intended for projects using TypeScript and ESM.

## Objective

- Provide a lightweight library with minimal dependencies.
- Provide a wrapper that satisfies how Cloudflare returns errors and processes requests.
- Provide several stubs for the latest Cloudflare API (Zones, DNS, Rules).
- [Extendability](#Extendability)

## Extendability

If an API stub is missing some fields or you feel like some interfaces are missing, you can add them locally and create a PR.

```ts
// Add 'missingField'

declare module '@e9x/cloudflare/v4' {
	interface Zone {
		missingField: boolean;
	}
}
```

## Request API

```ts
export default class Cloudflare {
    constructor({ key, email }: {
        key: string;
        email: string;
    });
    /** Send a GET request */
    get<ResponseType>(api: string): Promise<ResponseType>;
    /** Send a DELETE request */
    delete<ResponseType>(api: string): Promise<ResponseType>;
    /** Send a POST request */
    post<ResponseType, BodyType>(api: string, body: BodyType): Promise<ResponseType>;
    /** Send a PATCH request */
    patch<ResponseType, BodyType>(api: string, body: BodyType): Promise<ResponseType>;
    /** Send a PUT request */
    put<ResponseType, BodyType>(api: string, body: BodyType): Promise<ResponseType>;
}
```

The `body` parameter of post, patch, and put are JSON-stringifyable objects that are stringified and used as the request body. The type parameter for body may be manually specified to be more strictly typed. See [Add a DNS record](#add-a-dns-record).


The `api` parameter of all methods is a URL relative that originates from https://api.cloudflare.com/client/. The URL is resolved using the built-in URL class. The following URLs are valid examples:
- `http://alt-cloudflare-api/`
- `../client/v4/user`
- `v4/user`

Try to keep your API urls simple.

## Usage

V4 typedefs may be explored in the `.d.ts` file.

### Import a type

```ts
import type { Zone } from '@e9x/cloudflare/v4';
```

### Import the library

```ts
import Cloudflare from '@e9x/cloudflare';
```

### Create an instance

```ts
const cf = new Cloudflare({
	key: 'API key',
	email: 'API email',
});
```

### List all zones in account

```ts
import { listAllZones } from '@e9x/cloudflare/v4';
// ...
for await (const zone of listAllZones(cf)) console.log(zone); // { id: ..., name: ... }
```

### Update some zone settings

```ts
await cf.patch(`v4/zones/${zone.id}/settings/always_use_https`, {
	value: 'on',
});

await cf.patch(`v4/zones/${zone.id}/settings/ssl`, {
	value: 'full',
});
```

### Add a DNS record

```ts
await cf.post<DNSRecord, AddDNSRecord>(`v4/zones/${zone.id}/dns_records`, {
	type: 'A',
	name: `www.${zone.name}`,
	content: '1.1.1.1',
	ttl: 1,
});
```

### List zone DNS records (validate the above worked)

```ts
const records = await cf.get<DNSRecord[]>(`v4/zones/${zone.id}/dns_records`);
console.log(records);
```
