const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send("Missing url parameter");
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": targetUrl
            }
        });

        let data = await response.text();

        // CORS header
        res.setHeader("Access-Control-Allow-Origin", "*");

        // Agar m3u8 hai to segment rewrite karo
        if (targetUrl.endsWith(".m3u8")) {
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

            data = data.replace(/(.*\.ts)/g, (match) => {
                let segmentUrl = match.startsWith("http")
                    ? match
                    : baseUrl + match;

                return `/proxy?url=${encodeURIComponent(segmentUrl)}`;
            });

            res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        }

        res.send(data);

    } catch (err) {
        res.status(500).send("Error fetching stream");
    }
});

app.listen(3000, () => console.log("Proxy running on port 3000"));
