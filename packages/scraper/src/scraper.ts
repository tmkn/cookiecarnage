import { chromium, Page } from "playwright";

export async function getPageTitle(url: string): Promise<string> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const title = await page.evaluate(() => document.title);

    await browser.close();

    return title;
}
