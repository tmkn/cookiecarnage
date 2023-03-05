import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";

import { getPageTitle } from "scraper";

const server: FastifyInstance = Fastify({ logger: true });

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            200: {
                type: "object",
                properties: {
                    pong: {
                        type: "string"
                    }
                }
            }
        }
    }
};

server.get("/ping", opts, async (request, reply) => {
    const title = await getPageTitle("https://www.google.com");
    
    return { pong: title };
});

const start = async () => {
    try {
        await server.listen({ port: 3000 });

        const address = server.server.address();
        const port = typeof address === "string" ? address : address?.port;
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
