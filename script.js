

    
    const ENTRIES_PER_PAGE = 10;
    let currentIndex = 0;
    let diaryEntries = [];
    let filteredEntries = [];
    
document.addEventListener("DOMContentLoaded", function() {
    // Function to fetch quotes from the text file
    function fetchQuotes() {
        return fetch('quotes.txt')
            .then(response => response.text())
            .then(text => text.split('\n').filter(line => line.trim().length > 0));
    }

    // Function to select a random quote
    function getRandomQuote(quotes) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        return quotes[randomIndex];
    }


    // Fetch quotes and replace the text in .footer
    fetchQuotes().then(quotes => {
        const footerElement = document.querySelector(".quote");
        if (footerElement && quotes.length > 0) {
            footerElement.textContent = getRandomQuote(quotes);
        }
    });

    fetch('diary.txt')
        .then(response => response.text())
        .then(data => {
            const entries = data.split('---').map(entry => entry.trim()).filter(entry => entry.length > 0);
            diaryEntries = entries.map((entry, index) => ({
                id: `entry${entries.length - index}`, // Reverse the ID assignment
                content: entry
            }));

            filteredEntries = [...diaryEntries];
            displayEntries();

            // Check if there's a specific entry ID in the URL fragment
            const urlFragment = window.location.hash.substring(1);
            if (urlFragment) {
                loadAndScrollToEntry(urlFragment);
            }
        });

    document.getElementById('search').addEventListener('input', searchEntries);
    document.getElementById('load-more').addEventListener('click', displayEntries);
});





function resetEntries() {
    currentIndex = 0;
    document.getElementById('diary-entries').innerHTML = '';
    displayEntries();
}

function searchEntries() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    currentIndex = 0;
    filteredEntries = diaryEntries.filter(entry => entry.content.toLowerCase().includes(searchTerm));
    document.getElementById('diary-entries').innerHTML = '';

    // Reset and display the "Load More" button if there are search results
    if (filteredEntries.length > 0) {
        document.getElementById('load-more').style.display = 'block';
    } else {
        document.getElementById('load-more').style.display = 'none';
    }

    displayEntries();
}

function displayEntries() {
    const diaryContainer = document.getElementById('diary-entries');

    for (let i = 0; i < ENTRIES_PER_PAGE && currentIndex < filteredEntries.length; i++, currentIndex++) {
        const entryElement = document.createElement('div');
        entryElement.className = 'diary-entry';
        entryElement.id = filteredEntries[currentIndex].id; // Assign unique ID in reverse order
        entryElement.innerHTML = filteredEntries[currentIndex].content; // Use innerHTML to render HTML tags
        diaryContainer.appendChild(entryElement);
    }

    // Hide "Load More" button if all entries are displayed
    if (currentIndex >= filteredEntries.length) {
        document.getElementById('load-more').style.display = 'none';
    }
}

function loadAndScrollToEntry(entryId) {
    // Continue loading entries until the desired one is found or all are loaded
    function findAndScroll() {
        const entryElement = document.getElementById(entryId);
        if (entryElement) {
            entryElement.scrollIntoView();
            entryElement.classList.add('highlight'); // Optional: Add a highlight effect
            setTimeout(() => entryElement.classList.remove('highlight'), 2000);
        } else if (currentIndex < filteredEntries.length) {
            displayEntries();
            setTimeout(findAndScroll, 100); // Recursively try again after loading more
        }
    }

    findAndScroll();
}
