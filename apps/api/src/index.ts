import express from "express";

const port = Number(process.env.PORT ?? 4000);
const app = express();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
