const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("Missing url");

    try {
        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": targetUrl
            }
        });

        const contentType = response.headers.get("content-type");
        const buffer = await response.buffer();

        res.setHeader("Access-Control-Allow-Origin", "*");

        // Agar m3u8 hai to rewrite karo
        if (contentType && contentType.includes("mpegurl")) {
            let data = buffer.toString();

            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

            data = data.replace(/(http.*\.m3u8|http.*\.ts|.*\.m3u8|.*\.ts)/g, (match) => {
    let absoluteUrl = match.startsWith("http")
        ? match
        : baseUrl + match;

    return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
});
            });

            res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
            return res.send(data);
        }

        // Agar segment hai (binary)
        res.setHeader("Content-Type", contentType);
        res.send(buffer);

    } catch (err) {
        res.status(500).send("Error fetching stream");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
