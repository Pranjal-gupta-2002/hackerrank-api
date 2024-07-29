const express = require("express");
const cors = require("cors");
// const fetch = require("node-fetch");
const cheerio = require("cheerio");

const app = express();
const port = 3000;

app.use(cors());

async function getHackerRankProfile(username) {
  const url = `https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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

async function scrapeHackerRankProfile(username) {
  const url = `https://www.hackerrank.com/${username}`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const badges = [];
    $('[class*="badge-title"]').each((i, el) => {
      const title = $(el).attr("title") || $(el).text().trim();
      if (title) badges.push(title);
    });

    const certificates = [];
    $('[class*="certificate_v3-heading"]').each((i, el) => {
      const fullText = $(el).clone().children().remove().end().text().trim();
      const certificateName = fullText.replace(/^Certificate:\s*/, "").trim();
      if (certificateName) {
        certificates.push(certificateName);
      }
    });

    const workExperience = [];
    $('.timeline-item-content').each((i, el) => {
      const company = $(el).find('.timeline-item-title').text().trim();
      let duration = $(el).find('.timeline-item-duration').text().trim();
      duration = duration.replace(/^[.\s]+/, '');

      if (company || duration) {
        workExperience.push({ company, duration });
      }
    });

    return { badges, certificates, workExperience };
  } catch (error) {
    console.error(`Error scraping profile for ${username}:`, error.message);
    return null;
  }
}

app.get("/role", (req, res) => {
  res.json({ message: "Your role is software developer" });
});

app.get("/profile/:username", async (req, res) => {
  const { username } = req.params;
  console.log("Requested username:", username);

  try {
    const [apiData, scrapedData] = await Promise.all([
      getHackerRankProfile(username),
      scrapeHackerRankProfile(username),
    ]);
console.log(apiData)
    if (apiData.model && scrapedData) {
      const combinedData = {
        username: apiData.model.username,
        country: apiData.model.country,
        school: apiData.model.school,
        created_at: apiData.model.created_at,
        level: apiData.model.level,
        avatar: apiData.model.avatar,
        website: apiData.model.website,
        short_bio: apiData.model.short_bio,
        name: apiData.model.name,
        jobs_headline: apiData.model.jobs_headline,
        linkedin_url: apiData.model.linkedin_url,
        github_url: apiData.model.github_url,
        resume: apiData.model.resume,
        badges:scrapedData.badges,
        certificates:scrapedData.certificates,
        workExperience:scrapedData.workExperience
      };
 

      console.log("Combined data:", JSON.stringify(combinedData, null, 2));
      res.json(combinedData);
    } else {
      res.status(404).json({ error: "Failed to fetch profile data" });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Enhanced HackerRank Proxy API listening at http://localhost:${port}`);
});
