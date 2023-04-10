import * as fs from "fs";
import * as path from "path";

import { chromium, Page } from "playwright";
import type { IMineData } from "./level-miner-entry";

export async function getMineData(url: string): Promise<IMineData> {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    return runMiner(page, url);
}

export async function runMiner(page: Page, url: string): Promise<IMineData> {
    try {
        const scaperCodePath = path.join(__dirname, "level-miner.js");
        const scaperCode: string = fs.readFileSync(scaperCodePath, "utf8");

        await page.goto(url);

        await page.addScriptTag({
            content: scaperCode
        });

        return page.evaluate(() => {
            // @ts-ignore
            return LevelMiner.mine();
        });
    } catch (e) {
        console.error(e);

        throw new Error("fuck");
    }
}
