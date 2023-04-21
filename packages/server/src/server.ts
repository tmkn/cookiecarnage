import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";

import { getMineData } from "miner";

const server: FastifyInstance = Fastify({ logger: true });

const opts: RouteShorthandOptions = {
    schema: {
        querystring: {
            type: "object",
            // required: ["url"],
            properties: {
                url: { type: "string" }
            }
        },
        response: {
            200: {
                type: "object",
                additionalProperties: true
            }
        }
    }
};

server.get("/ping", opts, async (request, reply) => {
    const { url = "https://www.google.com" } = request.query as { url?: string };

    const data = await getMineData(url);

    return data;
});

const start = async () => {
    try {
        await server.listen({ port: 2345 });

        const address = server.server.address();
        const port = typeof address === "string" ? address : address?.port;
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
