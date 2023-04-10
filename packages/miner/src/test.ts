import { chromium, Page } from "playwright";

import { runMiner } from "./index";

(async () => {
    const browser = await chromium.launch({
        headless: false
    });
    const page = await browser.newPage();

    const data = await runMiner(page, "https://news.ycombinator.com/");

    console.log(data);

    await new Promise(resolve => {
        page.on("close", resolve);
    });

    // await context.close();
    await browser.close();
})();
