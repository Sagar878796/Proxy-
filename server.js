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

    const contentType = response.headers.get("content-type") || "";
    const buffer = await response.buffer();

    res.setHeader("Access-Control-Allow-Origin", "*");

    // 🔥 Agar text playlist hai to rewrite karo (content-type check mat karo)
    if (targetUrl.includes(".m3u8")) {
      let data = buffer.toString();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      data = data.replace(/(.*\.m3u8|.*\.ts)/g, (line) => {
        if (line.startsWith("#")) return line;

        let absolute = line.startsWith("http")
          ? line
          : baseUrl + line;

        return `/proxy?url=${encodeURIComponent(absolute)}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      return res.send(data);
    }

    // Binary segment
    res.setHeader("Content-Type", contentType);
    res.send(buffer);

  } catch (err) {
    res.status(500).send("Error fetching stream");
  }
});
