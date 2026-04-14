const fetch = require('node-fetch');
const cheerio = require('cheerio');

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
};

const TEAMS = ['Bayern Munich', 'Dortmund', 'Leverkusen', 'Leipzig', 'Stuttgart'];

async function debugPage(url, title) {
  console.log(`\n\n==== DEBUGGING ${title}: ${url} ====`);
  const res = await fetch(url, { headers });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('table#btable').each((tableIdx, tableEl) => {
    // Buscar el header más cercano antes de esta tabla
    const header = $(tableEl).prevAll('h2, h3, b').first().text().trim();
    console.log(`\n[Table ${tableIdx}] Header: "${header}"`);
    
    const rows = $(tableEl).find('tr.odd, tr.even');
    rows.each((rowIdx, el) => {
      const td = $(el).find('td');
      const teamName = td.eq(0).text().trim().replace(/\s+/g, ' ');
      
      const target = TEAMS.find(t => teamName.includes(t));
      if (target) {
        console.log(`  Row ${rowIdx}: [Team: ${target}] (Full: "${teamName}")`);
        td.each((colIdx, cell) => {
            console.log(`    Index ${colIdx}: "${$(cell).text().trim()}"`);
        });
      }
    });
  });
}

async function run() {
  await debugPage('https://www.soccerstats.com/table.asp?league=germany&tid=c', 'GOALS (tid=c)');
  await debugPage('https://www.soccerstats.com/table.asp?league=germany&tid=cr', 'CORNERS (tid=cr)');
}

run();
