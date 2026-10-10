import { ENV } from '../../config/env.js';

// Output JSON for test assertions
console.log(
  JSON.stringify({
    port: ENV.PORT,
    hasMongoUri: Boolean(ENV.MONGODB_URI),
    uriPrefix: ENV.MONGODB_URI ? ENV.MONGODB_URI.split(':')[0] : '',
  })
);
