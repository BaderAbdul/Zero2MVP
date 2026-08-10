const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
fetch('https://identitytoolkit.googleapis.com').then(r => console.log(r.status)).catch(e => console.error(e.message));
