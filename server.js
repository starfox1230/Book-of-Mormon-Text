const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Scripture Fetcher API is running');
});

app.get('/scripture/:book/:chapter', async (req, res) => {
    const { book, chapter } = req.params;
    const url = `https://openscriptureapi.org/api/scriptures/v1/lds/en/volume/bookofmormon/${book}/${chapter}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
