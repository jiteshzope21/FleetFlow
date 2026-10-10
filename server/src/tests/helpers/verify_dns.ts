import dns from 'dns';
import '../../config/dns.js';

const servers = dns.getServers();
console.log(
  JSON.stringify({
    hasGoogleDns: servers.includes('8.8.8.8'),
    servers,
  })
);
