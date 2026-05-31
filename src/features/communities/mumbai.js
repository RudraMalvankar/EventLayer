/**
 * Curated Mumbai tech communities — matched against event organizer, title, tags.
 * Run scrapers to populate events; these keywords link scraped data to communities.
 */
export const MUMBAI_COMMUNITIES = [
  {
    slug: "echai",
    name: "eChai Mumbai",
    city: "Mumbai",
    description:
      "Startup founders, product leaders, and builders. Regular meetups on growth, AI, and fundraising.",
    keywords: ["echai", "e-chai", "e chai"],
    tags: ["startups", "networking", "founders"],
    links: { website: "https://echai.in", luma: "https://lu.ma/echai" },
  },
  {
    slug: "gdg-cloud-mumbai",
    name: "GDG Cloud Mumbai",
    city: "Mumbai",
    description:
      "Google Developer Group focused on Google Cloud, Kubernetes, and cloud-native engineering.",
    keywords: ["gdg cloud mumbai", "gdg cloud", "google developer group cloud", "gdg mumbai cloud"],
    tags: ["gcp", "cloud", "devops"],
    links: { meetup: "https://www.meetup.com/gdg-cloud-mumbai" },
  },
  {
    slug: "gdg-mumbai",
    name: "GDG Mumbai",
    city: "Mumbai",
    description: "Google Developer Group Mumbai — Android, Flutter, Firebase, and Google tech.",
    keywords: ["gdg mumbai", "google developer group mumbai", "gdg on campus mumbai"],
    tags: ["android", "flutter", "google"],
    links: { meetup: "https://www.meetup.com/GDG-Mumbai" },
  },
  {
    slug: "mumbai-js",
    name: "Mumbai JavaScript / React",
    city: "Mumbai",
    description: "JavaScript, React, and frontend engineering meetups across Mumbai.",
    keywords: ["mumbai js", "mumbai javascript", "react mumbai", "reactjs mumbai", "js mumbai"],
    tags: ["javascript", "react", "frontend"],
    links: { meetup: "https://www.meetup.com/mumbai-js-meetup" },
  },
  {
    slug: "mumbai-java",
    name: "Mumbai Java User Group",
    city: "Mumbai",
    description: "Enterprise Java, Spring, JVM performance, and backend engineering.",
    keywords: ["mumbai java", "java user group mumbai", "jug mumbai"],
    tags: ["java", "spring", "backend"],
    links: {},
  },
  {
    slug: "aws-mumbai",
    name: "AWS User Group Mumbai",
    city: "Mumbai",
    description: "Amazon Web Services builders — serverless, architecture, and cloud ops.",
    keywords: ["aws user group mumbai", "aws mumbai", "amazon web services mumbai"],
    tags: ["aws", "cloud", "serverless"],
    links: { meetup: "https://www.meetup.com/AWS-Mumbai-User-Group" },
  },
  {
    slug: "cncf-mumbai",
    name: "CNCF Mumbai",
    city: "Mumbai",
    description: "Cloud Native Computing Foundation community — K8s, Prometheus, Istio.",
    keywords: ["cncf mumbai", "cloud native mumbai", "kubernetes mumbai"],
    tags: ["kubernetes", "devops", "cloud-native"],
    links: {},
  },
  {
    slug: "devops-mumbai",
    name: "DevOps Mumbai",
    city: "Mumbai",
    description: "CI/CD, infrastructure as code, SRE, and platform engineering.",
    keywords: ["devops mumbai", "sre mumbai", "platform engineering mumbai"],
    tags: ["devops", "sre", "platform"],
    links: {},
  },
  {
    slug: "python-mumbai",
    name: "PyMumbai",
    city: "Mumbai",
    description: "Python developers — data science, Django, FastAPI, and ML workshops.",
    keywords: ["pymumbai", "python mumbai", "py mumbai", "django mumbai"],
    tags: ["python", "data", "ml"],
    links: { meetup: "https://www.meetup.com/PyMumbai" },
  },
  {
    slug: "null-mumbai",
    name: "Null Mumbai",
    city: "Mumbai",
    description: "Information security community — AppSec, red team, and security research.",
    keywords: ["null mumbai", "null community mumbai", "owasp mumbai"],
    tags: ["security", "appsec", "infosec"],
    links: { website: "https://null.community" },
  },
  {
    slug: "mumbai-product",
    name: "The Product Folks Mumbai",
    city: "Mumbai",
    description: "Product management, UX, and growth for consumer and B2B products.",
    keywords: ["product folks mumbai", "product management mumbai", "pm mumbai"],
    tags: ["product", "ux", "growth"],
    links: {},
  },
  {
    slug: "hasgeek-mumbai",
    name: "Hasgeek Mumbai",
    city: "Mumbai",
    description: "Deep-tech conferences and meetups — data, AI, and systems programming.",
    keywords: ["hasgeek", "fifth elephant", "metup mumbai"],
    tags: ["conference", "data", "systems"],
    links: { website: "https://hasgeek.com" },
  },
  {
    slug: "mumbai-blockchain",
    name: "Mumbai Blockchain & Web3",
    city: "Mumbai",
    description: "Web3 builders, smart contracts, and decentralized apps in Mumbai.",
    keywords: ["blockchain mumbai", "web3 mumbai", "crypto mumbai", "ethereum mumbai"],
    tags: ["web3", "blockchain"],
    links: {},
  },
  {
    slug: "mumbai-ai",
    name: "Mumbai AI / ML Community",
    city: "Mumbai",
    description: "Machine learning, LLMs, computer vision, and applied AI meetups.",
    keywords: ["ai mumbai", "ml mumbai", "machine learning mumbai", "genai mumbai", "llm mumbai"],
    tags: ["ai", "ml", "genai"],
    links: {},
  },
  {
    slug: "devfolio-mumbai",
    name: "Devfolio Mumbai Hackathons",
    city: "Mumbai",
    description: "Hackathons and college devfests in Mumbai and Navi Mumbai.",
    keywords: ["devfolio", "hackathon mumbai", "devfest mumbai"],
    tags: ["hackathon", "devfolio"],
    links: { website: "https://devfolio.co" },
  },
  {
    slug: "tie-mumbai",
    name: "TiE Mumbai",
    city: "Mumbai",
    description: "Entrepreneurs and angel investors — pitch nights and founder mentorship.",
    keywords: ["tie mumbai", "tie mumbai angels", "entrepreneurs mumbai"],
    tags: ["startups", "investors", "networking"],
    links: { website: "https://mumbai.tie.org" },
  },
];

const COMMUNITY_LOGO_DOMAINS = {
  echai: "echai.in",
  "gdg-cloud-mumbai": "cloud.google.com",
  "gdg-mumbai": "developers.google.com",
  "mumbai-js": "react.dev",
  "mumbai-java": "oracle.com",
  "aws-mumbai": "aws.amazon.com",
  "cncf-mumbai": "cncf.io",
  "devops-mumbai": "docker.com",
  "python-mumbai": "python.org",
  "null-mumbai": "null.community",
  "mumbai-product": "theproductfolks.com",
  "hasgeek-mumbai": "hasgeek.com",
  "mumbai-blockchain": "ethereum.org",
  "mumbai-ai": "huggingface.co",
  "devfolio-mumbai": "devfolio.co",
  "tie-mumbai": "tie.org",
};

function linkHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getCommunityLogoUrl(community) {
  if (!community) return null;
  if (community.logo_url) return community.logo_url;

  const domain =
    community.logo_domain ||
    COMMUNITY_LOGO_DOMAINS[community.slug] ||
    linkHostname(community.links?.website) ||
    linkHostname(community.links?.meetup) ||
    linkHostname(community.links?.luma);

  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  const initials = encodeURIComponent((community.name || "C").slice(0, 2));
  return `https://ui-avatars.com/api/?name=${initials}&background=ff6b00&color=fff&size=128&bold=true`;
}

export function withCommunityLogo(community) {
  if (!community) return community;
  return { ...community, logo_url: getCommunityLogoUrl(community) };
}

export function getCommunityBySlug(slug) {
  const community = MUMBAI_COMMUNITIES.find((c) => c.slug === slug) || null;
  return community ? withCommunityLogo(community) : null;
}

export function listCommunities({ city = "Mumbai" } = {}) {
  const normalized = String(city || "").toLowerCase();
  let list = MUMBAI_COMMUNITIES;
  if (normalized && normalized !== "all") {
    list = MUMBAI_COMMUNITIES.filter((c) =>
      String(c.city || "").toLowerCase().includes(normalized),
    );
  }
  return list.map(withCommunityLogo);
}

function haystackForEvent(event = {}) {
  return [
    event.organizer,
    event.title,
    event.description,
    ...(Array.isArray(event.tags) ? event.tags : []),
    event.platform,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function eventMatchesCommunity(event, community) {
  if (!event || !community) return false;
  const haystack = haystackForEvent(event);
  const city = String(event.city || "").toLowerCase();
  const inMumbai =
    city.includes("mumbai") ||
    city.includes("navimumbai") ||
    city.includes("navi mumbai") ||
    city.includes("thane") ||
    haystack.includes("mumbai");

  if (!inMumbai && community.city === "Mumbai") {
    // still allow strong keyword match for online Mumbai-hosted events
    const strong = (community.keywords || []).some((kw) =>
      haystack.includes(String(kw).toLowerCase()),
    );
    if (!strong) return false;
  }

  return (community.keywords || []).some((kw) =>
    haystack.includes(String(kw).toLowerCase()),
  );
}

export function countEventsForCommunity(events, community) {
  return events.filter((e) => eventMatchesCommunity(e, community)).length;
}
