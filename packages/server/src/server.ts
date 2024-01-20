import Fastify, { FastifyInstance, RouteShorthandOptions } from "fastify";
import { Client } from "undici";

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

server.get("/data", opts, async (request, reply) => {
    const { url = "https://www.google.com" } = request.query as { url?: string };

    const data = await getMineData(url);

    return data;
});

server.get("/proxy", opts, (request, reply) => {
    const { url: urlParam = "https://www.google.com" } = request.query as { url?: string };

    const url = new URL(urlParam);
    const client = new Client(`${url.origin}`);

    client.stream(
        {
            path: `${url.pathname}${url.search}`,
            method: "GET",
            opaque: reply
        },
        ({ opaque }) => (opaque as any).raw
    );
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
