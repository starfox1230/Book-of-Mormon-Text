// scripts/downloadData.js
//
// ——————————————————————————————————————————————————————————
//  Universally pull every volume → book → chapter → verses
//  and dump JSON into data/<volumeId>/<bookId>.json
// ——————————————————————————————————————————————————————————

const fetch = require('node-fetch');
const fs    = require('fs/promises');
const path  = require('path');

const BASE = 'https://openscriptureapi.org/api/scriptures/v1/lds/en';

async function main() {
  // 1) get all volumes (OT, NT, BoM, D&C, PGP)
  const volsRes = await fetch(`${BASE}/volumes`);
  if (!volsRes.ok) throw new Error(`Volumes error: ${volsRes.statusText}`);
  const { volumes } = await volsRes.json();

  for (const vol of volumes) {
    console.log(`⤷ Volume: ${vol._id}`);

    // 2) fetch volume details to get books[]
    const volRes = await fetch(`${BASE}/volume/${vol._id}`);
    if (!volRes.ok) throw new Error(`Volume ${vol._id} error: ${volRes.statusText}`);
    const volData = await volRes.json();

    for (const bookMeta of volData.books) {
      console.log(`  • Book: ${bookMeta._id}`);

      // 3a) fetch book model to learn how many chapters
      const bookRes = await fetch(`${BASE}/book/${bookMeta._id}`);
      if (!bookRes.ok) throw new Error(`Book ${bookMeta._id} error: ${bookRes.statusText}`);
      const bookData = await bookRes.json();

      // prepare book container
      const bookObj = {
        _id:         bookData._id,
        title:       bookData.title,
        subtitle:    bookData.subtitle,
        delineation: bookData.chapterDelineation,
        chapters:    []
      };

      // 3b) fetch every chapter in turn
      for (let i = 0; i < bookData.chapters.length; i++) {
        const chapNum = i + 1;
        process.stdout.write(`    → fetching chapter ${chapNum}… `);
        const chapRes = await fetch(`${BASE}/book/${bookMeta._id}/${chapNum}`);
        if (!chapRes.ok) {
          console.error(`FAILED (${chapRes.status})`);
          continue;
        }
        const chapData = await chapRes.json();
        bookObj.chapters.push({
          number:     chapData.chapter.number,
          verses:     chapData.chapter.verses
        });
        console.log(`OK`);
      }

      // 4) write out to data/<volumeId>/<bookId>.json
      const outDir  = path.join(__dirname, '..', 'data', vol._id);
      const outFile = path.join(outDir, `${bookMeta._id}.json`);
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(outFile, JSON.stringify(bookObj, null, 2), 'utf-8');
      console.log(`  ✓ wrote ${path.relative(process.cwd(), outFile)}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
