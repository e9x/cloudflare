import type Cloudflare from './Cloudflare.js';

/**
 * POST zones/:zone_identifier/dns_records
 */
export interface AddDNSRecord {
	type: DNSRecord['type'];
	name: string;
	content: string;
	ttl: number;
	priority?: number;
	proxied: boolean;
}

export interface Zone {
	id: string;
	name: string;
	status: 'active' | 'inactive';
}

export interface Setting<V = unknown> {
	id: string;
	value: V;
	modified_on: string | null;
	editable: boolean;
}

export interface Rule {
	id: string;
}

export interface DNSRecord {
	id: string;
	proxied: boolean;
	name: string;
	content: string;
	type:
		| 'A'
		| 'AAAA'
		| 'CNAME'
		| 'HTTPS'
		| 'TXT'
		| 'SRV'
		| 'LOC'
		| 'MX'
		| 'NS'
		| 'CERT'
		| 'DNSKEY'
		| 'DS'
		| 'NAPTR'
		| 'SMIMEA'
		| 'SSHFP'
		| 'SVCB'
		| 'TLSA'
		| 'URI';
}

export async function* listAllZones(cf: Cloudflare) {
	let page = 0;

	while (true) {
		page++;

		const zones = await cf.get<Zone[]>(`v4/zones?per_page=50&page=${page}`);

		if (!zones.length) break;

		for (const zone of zones) yield zone;
	}
}
