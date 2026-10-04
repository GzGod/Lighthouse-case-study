const fs = require('fs');
const path = require('path');
const { readSourceRows, buildSnapshot } = require('../server/case-study-sync');

async function main() {
  if (!process.env.LIGHTHOUSE_SOURCE_DATABASE_URL && !process.env.SOURCE_DATABASE_URL) {
    throw new Error('Set the read-only source database URL before exporting project logos');
  }
  const snapshot = buildSnapshot(await readSourceRows());
  const records = Object.fromEntries(snapshot.projects
    .filter(project => project.logo || project.website)
    .map(({ slug, logo, website }) => [slug, { logo: logo || '', website: website || '' }]));
  fs.writeFileSync(path.join(__dirname, '..', 'server', 'public-project-logos.json'), `${JSON.stringify(records)}\n`);
  console.log(`Exported logo metadata for ${Object.keys(records).length} projects`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
