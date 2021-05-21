// Require the framework and instantiate it
const fastifyPkg = require('fastify');
const fastifyCors = require('fastify-cors');
const fastifyCookie = require('fastify-cookie');
const fastifyStatic = require('fastify-static');
const multipart = require('fastify-multipart');

const cpgRoutes = require('./cpgRoutes.js');
const { authRoutes } = require('./authRoutes.js');

const getEnv = require('getenv');
const path = require('path');
const jetpack = require('fs-jetpack');
const getenv = require('getenv');
const { cwd, read } = jetpack;
const galleryDataPath = process.env.GALLERY_DATA;
console.log('galleryData', galleryDataPath);
const fs = require('fs');

const https = getenv.bool('DEVELOPMENT')
  ? {
      https: {
        key: read('./server.key'),
        cert: read('./server.crt'),
      },
    }
  : {};
const fastify = fastifyPkg({
  // ...https,
  logger: {
    level: 'info',
    file: 'logs/fastify.txt', // will use pino.destination()
  },
});
fastify.register(fastifyCookie, {
  secret: getenv('COOKIE_SECRET'), // for cookies signature
  parseOptions: {}, // options for parsing cookies
});
fastify.register(multipart, { attachFieldsToBody: true });

fastify.register(fastifyStatic, {
  root: galleryDataPath,
  prefix: '/galleryData', // optional: default '/'
});
// fastify.register(fastifyCors, {
//   credentials: true,
//   origin: [/localhost/, /stedwardsfellwalkers\.co\.uk$/],
// });
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});
fastify.register(cpgRoutes, { prefix: 'cpg' });
fastify.register(authRoutes, { prefix: 'auth' });

// Run the server!
const runit = async () => {
  try {
    await fastify.listen(5555);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('listening on localhost:5555');
};
runit();
