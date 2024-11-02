const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors'); // CORS middleware

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes

app.get('/', (req, res) => {
    res.send('Scripture Fetcher API is running');
});

app.get('/scripture/:book/:startChapter/:chapterEnd?', async (req, res) => {
    const { book } = req.params;
    const startChapter = parseInt(req.params.startChapter, 10); // Convert to integer
    const chapterEnd = parseInt(req.params.chapterEnd || req.params.startChapter, 10); // Convert to integer, or use startChapter if endChapter is not provided

    // Ensure startChapter and endChapter are valid numbers
    if (isNaN(startChapter) || isNaN(chapterEnd)) {
        return res.status(400).send("Invalid chapter numbers.");
    }
    let scriptureText = ''; // This will store the final result

    // Prepare an array to hold promises and ensure results are in the correct order
    const chapterPromises = [];

    // Loop through the chapters from startChapter to endChapter (inclusive)
    for (let chapter = startChapter; chapter <= chapterEnd; chapter++) {
        const url = `https://openscriptureapi.org/api/scriptures/v1/lds/en/volume/bookofmormon/${book}/${chapter}`;
        
        // Create a promise for each chapter request
        const chapterPromise = fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error fetching data for chapter ${chapter}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => ({
                chapterNumber: chapter, // Save the chapter number to maintain order
                text: formatChapterText(data) // Format the chapter text
            }))
            .catch(error => ({
                chapterNumber: chapter,
                text: `Error fetching chapter ${chapter}: ${error.message}\n`
            }));

        // Add the promise to the array
        chapterPromises.push(chapterPromise);
    }

    // Wait for all the promises to resolve
    const chapters = await Promise.all(chapterPromises);

    // Sort chapters by chapterNumber to ensure they are in the correct order
    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    // Combine the results into the final scriptureText
    scriptureText = chapters.map(chapter => chapter.text).join('\n\n');

    res.send(scriptureText.trim());
});

// Helper function to format chapter text
function formatChapterText(data) {
    let text = `\n\n${data.chapter.bookTitle} Chapter ${data.chapter.number}\n\n`;
    data.chapter.verses.forEach((verse, index) => {
        text += `${index + 1}. ${verse.text}\n`;
    });
    return text;
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
