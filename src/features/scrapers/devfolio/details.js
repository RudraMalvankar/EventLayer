import * as cheerio from "cheerio";

function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return "";
  }
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value) {
  const text = normalizeText(value).replace(/(\d{1,2})(st|nd|rd|th)/gi, "$1");
  if (!text) return null;

  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    const year =
      slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3]);
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return null;
}

function parseRangeDate(value) {
  const text = normalizeText(value).replace(/(\d{1,2})(st|nd|rd|th)/gi, "$1");
  if (!text) return { start_date: null, end_date: null };

  const explicitMonths = text.match(
    /([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*([A-Za-z]{3,9})\s+(\d{1,2}),?\s*(\d{4})/,
  );
  if (explicitMonths) {
    const start = parseDate(
      `${explicitMonths[1]} ${explicitMonths[2]}, ${explicitMonths[5]}`,
    );
    const end = parseDate(
      `${explicitMonths[3]} ${explicitMonths[4]}, ${explicitMonths[5]}`,
    );
    return { start_date: start, end_date: end };
  }

  const sharedMonth = text.match(
    /([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*(\d{1,2}),?\s*(\d{4})/,
  );
  if (sharedMonth) {
    const start = parseDate(
      `${sharedMonth[1]} ${sharedMonth[2]}, ${sharedMonth[4]}`,
    );
    const end = parseDate(
      `${sharedMonth[1]} ${sharedMonth[3]}, ${sharedMonth[4]}`,
    );
    return { start_date: start, end_date: end };
  }

  const slashRange = text.match(
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/,
  );
  if (slashRange) {
    return {
      start_date: parseDate(slashRange[1]),
      end_date: parseDate(slashRange[2]),
    };
  }

  const single = parseDate(text);
  if (single) return { start_date: single, end_date: single };

  return { start_date: null, end_date: null };
}

function flattenJsonLd(value, results = []) {
  if (!value) return results;
  if (Array.isArray(value)) {
    value.forEach((item) => flattenJsonLd(item, results));
    return results;
  }
  if (typeof value === "object") {
    if (value["@graph"]) flattenJsonLd(value["@graph"], results);
    results.push(value);
  }
  return results;
}

function extractJsonLd($) {
  const items = [];
  $("script[type='application/ld+json']").each((_, element) => {
    const text = $(element).text().trim();
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      flattenJsonLd(parsed, items);
    } catch {
      // ignore invalid structured data
    }
  });
  return items;
}

function getOrganizer(eventLike) {
  const organizer = eventLike?.organizer;
  if (!organizer) return "";
  if (Array.isArray(organizer)) {
    const names = organizer.map((item) => item?.name).filter(Boolean);
    return names.join(", ");
  }
  return organizer?.name || "";
}

function getLocation(eventLike) {
  const location = eventLike?.location || {};
  const address = location?.address || {};
  return {
    city: address?.addressLocality || location?.name || "",
    country: address?.addressCountry || "",
    detail: normalizeText(
      address?.streetAddress || address?.addressRegion || location?.name || "",
    ),
  };
}

function extractVisibleDateText(bodyText) {
  const normalized = normalizeText(bodyText);
  const labels = ["RUNS FROM", "STARTS", "STARTS ON", "BEGINS"];

  for (const label of labels) {
    const index = normalized.toUpperCase().indexOf(label);
    if (index < 0) continue;
    let segment = normalized.slice(index + label.length).trim();
    const stopWords = [
      " HAPPENING ",
      " APPLICATIONS ",
      " APPLY NOW ",
      " SEE PROJECTS ",
      " BUILD ",
      " RULES ",
      " SPONSORS ",
      " FAQS ",
      " VENUE: ",
    ];
    for (const stopWord of stopWords) {
      const stopIndex = segment.toUpperCase().indexOf(stopWord);
      if (stopIndex > 0) {
        segment = segment.slice(0, stopIndex).trim();
      }
    }
    const parsed = parseRangeDate(segment) || {};
    if (parsed.start_date || parsed.end_date) return parsed;

    const singleMatch = segment.match(
      /(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4})/,
    );
    if (singleMatch) {
      const single = parseDate(singleMatch[1]);
      if (single) return { start_date: single, end_date: single };
    }
  }

  return { start_date: null, end_date: null };
}

export async function fetchDevfolioEventDetails(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("fetch failed " + res.status);

    const html = await res.text();
    const $ = cheerio.load(html);
    const ogTitle =
      $("meta[property='og:title']").attr("content") || $("title").text() || "";
    const ogDesc =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      "";
    const ogImage =
      $("meta[property='og:image']").attr("content") ||
      $("link[rel='image_src']").attr("href") ||
      "";
    const metaStart =
      $("meta[property='event:start_time']").attr("content") ||
      $("meta[property='event:start_date']").attr("content") ||
      $("meta[name='start_date']").attr("content") ||
      $("meta[itemprop='startDate']").attr("content") ||
      "";
    const metaEnd =
      $("meta[property='event:end_time']").attr("content") ||
      $("meta[property='event:end_date']").attr("content") ||
      $("meta[name='end_date']").attr("content") ||
      $("meta[itemprop='endDate']").attr("content") ||
      "";
    const h1 = $("h1").first().text().trim() || "";
    const structured = extractJsonLd($);
    const eventLike =
      structured.find((item) => {
        const type = item?.["@type"];
        return (
          type === "Event" ||
          (Array.isArray(type) && type.includes("Event")) ||
          item?.startDate ||
          item?.endDate
        );
      }) || {};

    const location = getLocation(eventLike);
    const organizer = getOrganizer(eventLike);
    const visibleDates = extractVisibleDateText($("body").text());

    return {
      title: (ogTitle || h1 || "").trim(),
      description: (ogDesc || "").trim(),
      banner_url: ogImage ? absoluteUrl(ogImage, url) : null,
      start_date:
        parseDate(eventLike.startDate || metaStart) || visibleDates.start_date,
      end_date:
        parseDate(eventLike.endDate || metaEnd) || visibleDates.end_date,
      organizer,
      city: location.city,
      country: location.country,
      location_detail: location.detail,
    };
  } catch {
    return {
      title: "",
      description: "",
      banner_url: null,
      start_date: null,
      end_date: null,
      organizer: "",
      city: "",
      country: "",
      location_detail: "",
    };
  }
}
