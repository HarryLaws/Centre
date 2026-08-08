import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SITE_URL =
  process.env.SITE_URL ||
  process.env.CF_PAGES_URL ||
  process.env.URL ||
  'https://tanfieldleacommunitycentre.com';

const normalizedSiteUrl = SITE_URL.replace(/\/$/, '');

const pages = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/about', changefreq: 'monthly', priority: '0.7' },
  { loc: '/news', changefreq: 'weekly', priority: '0.8' },
  { loc: '/booking', changefreq: 'weekly', priority: '0.9' }
];

const now = new Date().toISOString();

const urlEntries = pages
  .map(
    (page) => `  <url>\n    <loc>${normalizedSiteUrl}${page.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

const outputDir = path.resolve(process.cwd(), 'public');
const outputPath = path.join(outputDir, 'sitemap.xml');
const robotsPath = path.join(outputDir, 'robots.txt');

const robots = `User-agent: *\nAllow: /\n\n# Keep staff/admin screens out of search results\nDisallow: /staff\nDisallow: /staff/\nDisallow: /staff/dashboard\nDisallow: /staff/requests\nDisallow: /staff/calendar\n\nSitemap: ${normalizedSiteUrl}/sitemap.xml\n`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, sitemap, 'utf8');
await writeFile(robotsPath, robots, 'utf8');

console.log(`Generated sitemap: ${outputPath}`);
console.log(`Generated robots: ${robotsPath}`);
console.log(`Using site URL: ${normalizedSiteUrl}`);
if (!process.env.SITE_URL) {
  console.warn('SITE_URL is not set. Falling back to default/live domain in generator.');
}
