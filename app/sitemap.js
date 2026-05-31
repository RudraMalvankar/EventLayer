function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;

  return "https://eventlayer-dev.vercel.app";
}

export default function sitemap() {
  const siteUrl = getSiteUrl();
  const routes = [
    "/",
    "/events",
    "/explore",
    "/submit",
    "/saved",
    "/calendar",
    "/about",
    "/privacy-policy",
    "/terms",
    "/cookies",
    "/accessibility",
    "/contact",
  ];

  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
