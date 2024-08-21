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

    // Fetch diary entries
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

    // Add event listeners for search and load-more functionality
    document.getElementById('search').addEventListener('input', searchEntries);
    document.getElementById('load-more').addEventListener('click', displayEntries);

    // Fetch and display RSS feed
    fetch('/rss.xml') // Adjust the path if necessary
    .then(response => response.text())
    .then(text => {
        console.log('Fetched content:', text);
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });


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

// Function to convert UTC date to EST and format it
function convertToEST(utcDateStr) {
    // Create a Date object from the UTC date string
    let date = new Date(utcDateStr);

    // Convert to EST by subtracting the offset (5 hours for standard time, 4 hours for daylight saving time)
    // Note: Use -5 for EST or -4 for EDT, depending on whether daylight saving time is in effect
    let offset = -5; // This will change depending on whether daylight saving time is active or not.
    let estDate = new Date(date.getTime() + offset * 60 * 60 * 1000);

    // Format the date components
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let month = months[estDate.getUTCMonth()];
    let day = estDate.getUTCDate();
    let year = estDate.getUTCFullYear();
    let weekday = weekdays[estDate.getUTCDay()];

    let hours = estDate.getUTCHours().toString().padStart(2, '0');
    let minutes = estDate.getUTCMinutes().toString().padStart(2, '0');

    // Construct the formatted date string
    let formattedDate = `${month} ${day} ${year} (${weekday}) ${hours}:${minutes}`;

    return formattedDate;
}



// Function to fetch and display RSS updates
async function fetchRSSUpdates() {
    try {
        // Fetch the RSS feed
        const response = await fetch('rss.xml');
        const xmlText = await response.text();

        // Parse the XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Get the items from the RSS feed
        const items = xmlDoc.getElementsByTagName('item');
        const updateLog = document.getElementById('update-log');

        // Create HTML for each item
        let html = '<div style="margin-top:20px;margin-bottom:20px;font-family:neuropol;font-size:25px;text-align:center;color:#ffffff;text-shadow:0 0 3px #ffffff,0 0 7px #ffffff,0 0 10px #ffffff;">Update Log&nbsp;<a href="https://cyberk.neocities.org/rss.xml"><img src="/media/rss.png" alt="rss button" style="color: white; height:20px;border-radius:5px;"></a></div>';
        Array.from(items).forEach(item => {
            const title = item.getElementsByTagName('title')[0].textContent;
            const link = item.getElementsByTagName('link')[0].textContent;
            const description = item.getElementsByTagName('description')[0].textContent;
            const pubDateUTC = item.getElementsByTagName('pubDate')[0].textContent;

            // Convert the publication date to EST
            const pubDateEST = convertToEST(pubDateUTC);

            html += `<div class="rss-item">
                        <li style="color:#ffffff; margin-top:10px;">${pubDateEST}<br><span style="color:#ffffff;">${description}</span></li>
                     </div>`;
        });

        // Update the #update-log div with the new content
        updateLog.innerHTML = html;
    } catch (error) {
        console.error('Error fetching or parsing RSS feed:', error);
    }
}

// Call the function to fetch and display RSS updates on page load
fetchRSSUpdates();
