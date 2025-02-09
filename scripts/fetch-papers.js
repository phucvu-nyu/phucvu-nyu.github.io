import axios from 'axios';
import fs from 'fs/promises';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const parseXmlPromise = promisify(parseString);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fetchPapers() {
    try {
        console.log('Fetching papers from arXiv...');
        
        const response = await axios.get('http://export.arxiv.org/api/query', {
            params: {
                search_query: 'cat:stat.ME+OR+cat:stat.ML+OR+cat:q-bio.QM',
                sortBy: 'lastUpdatedDate',
                sortOrder: 'descending',
                max_results: 20
            }
        });

        const result = await parseXmlPromise(response.data);
        
        if (!result.feed || !result.feed.entry) {
            throw new Error('Invalid response from arXiv');
        }

        const papers = result.feed.entry.map(entry => ({
            title: entry.title[0],
            authors: entry.author.map(author => author.name[0]),
            summary: entry.summary[0],
            link: entry.id[0],
            published: entry.published[0],
            updated: entry.updated[0]
        }));

        const outputData = {
            lastUpdated: new Date().toISOString(),
            papers: papers
        };

        const outputPath = path.join(__dirname, '..', 'papers', 'papers.json');
        await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));
        
        console.log('Papers updated successfully');
    } catch (error) {
        console.error('Error fetching papers:', error);
        process.exit(1);
    }
}

fetchPapers();
