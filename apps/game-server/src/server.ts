import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { scrapeWebsite } from "@domageddon/scraper";

const app = new Hono();

app.get("/scrape", async c => {
    const url = c.req.query("url") ?? "https://google.com";

    try {
        const response = await scrapeWebsite(url);

        return c.json(response);
    } catch (error) {
        console.error(error);

        return c.status(500);
    }
});

const server = serve(app, info => {
    console.log(`Server is running on http://localhost:${info.port}`);
});

const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(err => {
        if (err) {
            console.error("Error during server shutdown:", err);
            process.exit(1);
        }
        console.log("Server shut down gracefully.");
        process.exit(0);
    });
};

// Listen for termination signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Listen for uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", err => {
    console.error("Uncaught exception:", err);
    gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled rejection at", promise, "reason:", reason);
    gracefulShutdown("unhandledRejection");
});
