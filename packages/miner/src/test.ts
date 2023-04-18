import { chromium, Page } from "playwright";

import { runMiner } from "./index";

(async () => {
    const browser = await chromium.launch({
        headless: false
    });
    const page = await browser.newPage({ bypassCSP: true });

    const data = await runMiner(page, "https://motherfuckingwebsite.com/");

    console.log(data);

    await new Promise(resolve => {
        page.on("close", resolve);
    });

    // await context.close();
    await browser.close();
})();
