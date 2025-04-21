import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

import { chromium, type Page } from "playwright";

interface IScraperResponse {
    url: string;
    level: string;
}

export async function scrapeWebsite(url: string): Promise<IScraperResponse> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const scraperFile = getScraperFile();

    await page.goto(url);
    await page.addScriptTag({ content: scraperFile });

    const response = await page.evaluate(() => {
        //@ts-ignore
        return JSON.stringify(window.Domageddon.collect());
    });

    await browser.close();

    return {
        url,
        level: JSON.parse(response)
    };
}

function getScraperFile(): string {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "level-crawler-dom",
        "dist",
        "domageddon.js"
    );

    if (!fs.existsSync(filePath)) {
        throw new Error(`Scraper file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf-8");

    console.log(`Using scraper file: ${filePath}`);

    return content;
}
