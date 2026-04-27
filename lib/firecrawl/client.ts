import FirecrawlApp from "@mendable/firecrawl-js";

/* Server-side only — never import this in client components */
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY ?? "",
});

export default firecrawl;
