async function loadPapers() {
    const papersSection = document.getElementById('papers');
    const updateTimeElement = document.getElementById('updateTime');

    try {
        // Show loading state
        papersSection.innerHTML = '<div class="loading">Loading papers...</div>';
        
        const response = await fetch('papers.json');
        if (!response.ok) {
            throw new Error('Failed to fetch papers');
        }
        
        const data = await response.json();
        
        // Update last updated time
        updateTimeElement.textContent = new Date(data.lastUpdated).toLocaleString();

        // Check if we have papers
        if (!data.papers || data.papers.length === 0) {
            papersSection.innerHTML = '<p>No papers available.</p>';
            return;
        }

        // Format and display papers
        const papersList = data.papers.map(paper => {
            // Handle both array and string cases for authors and title
            const title = Array.isArray(paper.title) ? paper.title[0] : paper.title;
            const authors = Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors;
            const summary = Array.isArray(paper.summary) ? paper.summary[0] : paper.summary;
            const link = Array.isArray(paper.link) ? paper.link[0] : paper.link;
            const published = new Date(paper.published).toLocaleDateString();

            return `
                <article class="paper-card">
                    <h2><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
                    <p class="authors">${authors}</p>
                    <p class="date">Published: ${published}</p>
                    <p class="summary">${summary}</p>
                    <a href="${link}" class="read-more" target="_blank" rel="noopener noreferrer">Read on arXiv →</a>
                </article>
            `;
        }).join('');

        papersSection.innerHTML = papersList;

    } catch (error) {
        console.error('Error loading papers:', error);
        papersSection.innerHTML = `
            <div class="error">
                <p>Error loading papers: ${error.message}</p>
                <button onclick="loadPapers()">Try Again</button>
            </div>
        `;
    }
}

// Load papers when the page loads
document.addEventListener('DOMContentLoaded', loadPapers);

// Add refresh functionality
const refreshButton = document.createElement('button');
refreshButton.textContent = 'Refresh Papers';
refreshButton.className = 'refresh-button';
refreshButton.onclick = loadPapers;
document.querySelector('.hero').appendChild(refreshButton);
