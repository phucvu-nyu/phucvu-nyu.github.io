#!/bin/bash

# Print colored output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handling
set -e

# Function to create file with message
create_file() {
    if touch "$1"; then
        echo -e "${GREEN}Created:${NC} $1"
    else
        echo -e "${RED}Error creating:${NC} $1"
        exit 1
    fi
}

# Function to create directory with message
create_dir() {
    if mkdir -p "$1"; then
        echo -e "${GREEN}Created directory:${NC} $1"
    else
        echo -e "${RED}Error creating directory:${NC} $1"
        exit 1
    fi
}

echo -e "${BLUE}Creating project structure...${NC}"

# Create root level files
create_file "index.html"
create_file "README.md"

# Update README with late days info
cat > README.md << EOL
# My Coding Blog

I used 0 late days this time, and I have 3 days remaining.

## Website
The website is hosted at: https://$(git config --get remote.origin.url | cut -d'/' -f4).github.io/

## AI Tools Used
- GitHub Copilot
- ChatGPT

## Project Structure:
\`\`\`
.
├── index.html              # Main homepage
├── styles/
│   └── main.css           # Global styles
├── pacman/                # Pac-Man game files
│   ├── index.html
│   ├── game.js
│   └── styles.css
├── papers/                # arXiv papers section
│   ├── index.html
│   ├── papers.js
│   └── styles.css
├── assets/               # Images and other static files
│   └── images/
├── scripts/              # Utility scripts
│   └── fetch-papers.js   # Script to fetch arXiv papers
└── .github/
    └── workflows/
        └── update-papers.yml  # GitHub Action for daily updates
\`\`\`
EOL

# Create styles directory and files
create_dir "styles"
create_file "styles/main.css"

# Create pacman directory and files
create_dir "pacman"
create_file "pacman/index.html"
create_file "pacman/game.js"
create_file "pacman/styles.css"

# Create papers directory and files
create_dir "papers"
create_file "papers/index.html"
create_file "papers/papers.js"
create_file "papers/styles.css"

# Create assets directory
create_dir "assets/images"

# Create scripts directory and files
create_dir "scripts"
create_file "scripts/fetch-papers.js"

# Create configuration file for arXiv keywords
create_file "scripts/config.json"
cat > scripts/config.json << EOL
{
    "keywords": ["machine learning", "statistics", "biostatistics"],
    "max_results": 10,
    "sort_by": "lastUpdatedDate"
}
EOL

# Create GitHub workflows directory and files
create_dir ".github/workflows"
create_file ".github/workflows/update-papers.yml"

# Add GitHub Actions workflow content
cat > .github/workflows/update-papers.yml << EOL
name: Update ArXiv Papers
on:
  schedule:
    - cron: '0 0 * * *'  # Run at midnight UTC
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - run: node scripts/fetch-papers.js
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add papers/
          git commit -m "Update papers list" || exit 0
          git push
EOL

# Set permissions
chmod +x scripts/*.js
chmod +x create_structure.sh

echo -e "\n${GREEN}Project structure created successfully!${NC}"
echo -e "${BLUE}Structure created matches README.md specification${NC}"

echo -e "${BLUE}Next steps:${NC}"
echo "1. Update config.json with your preferred arXiv keywords"
echo "2. Enable GitHub Pages in your repository settings"
echo "3. Implement the website content"
