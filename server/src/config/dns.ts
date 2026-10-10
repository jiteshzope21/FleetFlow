import dns from 'dns';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let dnsCustomConfigured = false;

/**
 * Configure Node.js DNS servers if DNS_SERVERS is provided in environment variables.
 * Resolves ECONNREFUSED on SRV queries when local router/ISP DNS fails to resolve SRV records.
 * Leaves system default DNS untouched if DNS_SERVERS is not set.
 */
export function configureDns(explicitServers?: string[]): string[] | null {
  if (dnsCustomConfigured && !explicitServers) {
    return dns.getServers();
  }

  const rawConfig = (ENV.DNS_SERVERS || '').trim();
  let servers: string[] = [];

  if (explicitServers && explicitServers.length > 0) {
    servers = explicitServers;
  } else if (rawConfig) {
    if (rawConfig.toLowerCase() === 'google' || rawConfig.toLowerCase() === 'true') {
      servers = ['8.8.8.8', '8.8.4.4'];
    } else if (rawConfig.toLowerCase() === 'cloudflare') {
      servers = ['1.1.1.1', '1.0.0.1'];
    } else {
      servers = rawConfig
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (servers.length === 0) {
    return null;
  }

  try {
    dns.setServers(servers);
    dnsCustomConfigured = true;
    logger.info(`Configured custom DNS resolvers for Atlas SRV resolution: [${servers.join(', ')}]`);
    return dns.getServers();
  } catch (err: any) {
    logger.warn(`Failed to apply custom DNS servers (${servers.join(', ')}): ${err.message}. Default system DNS retained.`);
    return null;
  }
}

export function isDnsCustomConfigured(): boolean {
  return dnsCustomConfigured;
}

// Automatically configure on import if DNS_SERVERS is set in environment
configureDns();
