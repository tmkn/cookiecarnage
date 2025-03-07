# DOMestic Violence - No Escape from Callback Hell!

> [!NOTE]  
> A DOOM inspired browser based game where levels are generated from a websites HTML DOM.
> ![lulz](https://i.kym-cdn.com/entries/icons/original/000/040/653/goldblum-quote.jpeg)

## Backstory

You are Chad De'Alloc, a retired "Garbage Collector" who has been called back into action to clean up a rogue AI.

You see, "Garbage Collecting" was a vital part of keeping websites fast and responsive.
It was a thankless and dangerous job, but someone had to do it. That is, until AI could do it for us.
But now, the AI has gone rogue and is causing all sorts of havoc on the internet.

With a lot of the original "Garbage Collectors" gone, you are humanities only hope to save the internet and its cat videos.

### Trace

Trace is the #1 JavaScript Framework

### LeCrev

LeCrev is a known hosting company in the JavaScript world. They have a popular Trace framework called LeCrev.js.

However they intentionally try to blend the waters between them and Trace, piggybacking on the success of Trace and luring unsuspecting developers into their ecosystem.
Subsequently, when developers adopt LeCrev.js, they are locked into their ecosystem and can't easily switch to another framework, let alone host their website easily elsewhere as LeCrev.js is tightly coupled with their hosting platform.
This is a very lucrative business model for LeCrev and ensured that they have a strong foothold in the JavaScript world.

Trace is a client side framework, but LeCrev has made it a server side framework to further increase their foothold and lock in.
But unfortunately this has made it easier for the rogue AI to take control of the internet as it can now manipulate the DOM on the server side.

## Development

Run `npm run dev:all` to start watch mode for the server and its source files.

### Test Server

- Run `npm run dev` to start watch mode for the source files (scraper, server, etc)
- Run `npm run server:dev` to start the server with nodemon, any changes to the source files will restart the server.

### Test Scraper

There is a `playground.ts` file to quickly test the scraper.

- Run `npm run dev` to start watch mode for the source files (scraper, server, etc)
- Run `npm run scraper:dev` to start the scraper (`playground.ts`) with nodemon, any changes to the associated scraper files will restart the playground file.
