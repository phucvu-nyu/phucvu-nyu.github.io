import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
import os

def fetch_papers():
    try:
        # Read config
        with open('scripts/config.json', 'r') as f:
            config = json.load(f)
        
        # Construct query with proper URL encoding
        base_url = 'http://export.arxiv.org/api/query?'
        search_query = '+OR+'.join(f'all:{urllib.parse.quote(keyword)}' for keyword in config['keywords'])
        
        params = {
            'search_query': search_query,
            'sortBy': 'submittedDate',
            'sortOrder': 'descending',
            'max_results': str(config['max_results'])
        }
        
        query = base_url + urllib.parse.urlencode(params)
        print(f"Fetching papers from arXiv...")
        print(f"URL: {query}")
        
        # Add headers to request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)'
        }
        
        req = urllib.request.Request(query, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            data = response.read()
        
        # Parse XML
        root = ET.fromstring(data)
        
        # Extract papers
        papers = []
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        for entry in root.findall('atom:entry', ns):
            paper = {
                'title': entry.find('atom:title', ns).text.strip(),
                'authors': [author.find('atom:name', ns).text 
                           for author in entry.findall('atom:author', ns)],
                'summary': entry.find('atom:summary', ns).text.strip(),
                'link': entry.find('atom:id', ns).text,
                'published': entry.find('atom:published', ns).text,
                'updated': entry.find('atom:updated', ns).text,
            }
            papers.append(paper)
        
        output_data = {
            'lastUpdated': datetime.now().isoformat(),
            'keywords': config['keywords'],
            'totalResults': len(papers),
            'papers': papers
        }
        
        # Ensure papers directory exists
        os.makedirs('papers', exist_ok=True)
        
        # Write output
        with open('papers/papers.json', 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully fetched {len(papers)} papers")
        
    except Exception as e:
        print(f"Error fetching papers: {str(e)}")
        raise

if __name__ == '__main__':
    fetch_papers()
