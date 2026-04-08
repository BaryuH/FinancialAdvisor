const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Minimal backend scaffold; expand with your API later.
// Kept dependency-free on purpose.
import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`backend listening on http://localhost:${port}`);
});

