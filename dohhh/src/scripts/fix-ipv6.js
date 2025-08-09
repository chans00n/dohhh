// Force IPv4 for database connections
const dns = require('dns');

// Force Node.js to use IPv4 first
dns.setDefaultResultOrder('ipv4first');

console.log('DNS resolution order set to IPv4 first');