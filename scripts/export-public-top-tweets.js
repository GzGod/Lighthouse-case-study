const fs = require('fs');
const path = require('path');
const { readSourceRows, buildSnapshot } = require('../server/case-study-sync');

async function main() {
  if (!process.env.LIGHTHOUSE_SOURCE_DATABASE_URL && !process.env.SOURCE_DATABASE_URL) {
    throw new Error('Set the read-only source database URL before exporting public top posts');
  }
  const snapshot = buildSnapshot(await readSourceRows());
  const tweetsByCase = Object.fromEntries(snapshot.cases
    .filter(item => item.topTweets?.length)
    .map(item => [item.id, item.topTweets]));
  const output = path.join(__dirname, '..', 'server', 'public-top-tweets.json');
  fs.writeFileSync(output, `${JSON.stringify(tweetsByCase)}\n`);
  console.log(`Exported top posts for ${Object.keys(tweetsByCase).length} public placements`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
