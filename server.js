const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

async function getHackerRankProfile(username) {
    const url = `https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching profile for ${username}:`, error.message);
        return null;
    }
}

app.get('/profile/:username', async (req, res) => {
    const { username } = req.params;
    console.log('Requested username:', username);

    const data = await getHackerRankProfile(username);
    if (data) {
        // Log the full raw response data in a pretty format
        console.log('Raw API response:', JSON.stringify(data, null, 2));

        // Send the raw data back to the client
        res.json(data);
    } else {
        res.status(404).json({ error: "Failed to fetch profile data" });
    }
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
    console.log(`HackerRank Proxy API listening at http://localhost:${port}`);
});
