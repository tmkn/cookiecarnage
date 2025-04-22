import { scrapeWebsite } from "@domageddon/scraper";

export default defineEventHandler(async event => {
    const { url = "https://google.com" } = getQuery(event);

    if (!url || typeof url !== "string")
        throw createError({
            status: 500,
            statusMessage: "url parameter is missing"
        });

    try {
        const response = await scrapeWebsite(url);

        return response;
    } catch (error) {
        throw createError({
            status: 500,
            statusMessage: error
        });
    }
});
