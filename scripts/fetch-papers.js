const https = require('https');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const config = require('./config.json');
const OUTPUT_FILE = path.join(__dirname, '../papers/papers.json');

function fetchArxiv(query) {
    return new Promise((resolve, reject) => {
        const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${config.max_results}&sortBy=${config.sort_by}&sortOrder=descending`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function updatePapers() {
    try {
        const papers = [];
        const parser = new xml2js.Parser();

        // Fetch papers for each keyword
        for (const keyword of config.keywords) {
            const xmlData = await fetchArxiv(keyword);
            const result = await parser.parseStringPromise(xmlData);
            
            const entries = result.feed.entry || [];
            papers.push(...entries.map(entry => ({
                title: entry.title[0],
                authors: entry.author.map(author => author.name[0]),
                abstract: entry.summary[0],
                pdfLink: entry.link.find(link => link.$.title === 'pdf').$.href,
                arxivLink: entry.link.find(link => link.$.rel === 'alternate').$.href,
                published: entry.published[0],
                updated: entry.updated[0],
                keyword: keyword
            })));
        }

        // Remove duplicates and sort by date
        const uniquePapers = Array.from(new Map(papers.map(paper => 
            [paper.arxivLink, paper]
        )).values());

        const sortedPapers = uniquePapers.sort((a, b) => 
            new Date(b.updated) - new Date(a.updated)
        );

        // Save to file
        const output = {
            papers: sortedPapers,
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
        console.log(`Updated ${sortedPapers.length} papers`);
    } catch (error) {
        console.error('Error updating papers:', error);
        process.exit(1);
    }
}

updatePapers();
