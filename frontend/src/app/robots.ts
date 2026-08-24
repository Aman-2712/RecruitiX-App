import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/about", "/founder", "/register", "/login"],
      disallow: ["/dashboard/"],
    },
    sitemap: "https://hirecue.online/sitemap.xml",
  };
}
