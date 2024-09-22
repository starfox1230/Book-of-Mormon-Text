const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // Add CORS middleware

const app = express();
const port = process.env.PORT || 3000;

// Use CORS middleware to avoid CORS issues
app.use(cors());

// Route to check if the server is running
app.get('/', (req, res) => {
    res.send('Scripture Fetcher API is running');
});

// Route to fetch a range of chapters from the API
app.get('/scripture/:book/:startChapter/:endChapter?', async (req, res) => {
    const { book, startChapter, endChapter } = req.params;
    const chapterEnd = endChapter || startChapter; // If no endChapter is provided, fetch only the startChapter

    let scriptureText = '';
    const fetchPromises = [];

    // Loop through the chapters from startChapter to endChapter (inclusive)
    for (let chapter = startChapter; chapter <= chapterEnd; chapter++) {
        const url = `https://openscriptureapi.org/api/scriptures/v1/lds/en/volume/bookofmormon/${book}/${chapter}`;

        // Fetch the data for each chapter and accumulate the results
        fetchPromises.push(
            fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error fetching data for chapter ${chapter}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                scriptureText += `\n\n${data.chapter.bookTitle} Chapter ${data.chapter.number}\n\n`;
                data.chapter.verses.forEach((verse, index) => {
                    scriptureText += `${index + 1}. ${verse.text}\n`;
                });
            })
            .catch(error => {
                scriptureText += `Error fetching chapter ${chapter}: ${error.message}\n`;
            })
        );
    }

    // Wait for all the chapters to be fetched
    Promise.all(fetchPromises)
        .then(() => res.send(scriptureText.trim())) // Send the combined scripture text back to the client
        .catch(error => res.status(500).send(`Error: ${error.message}`));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
