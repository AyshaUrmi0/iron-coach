// Runs the API as a normal server, for local development and the CI curl checks.
import { app } from "./app.js";
import { env } from "./env.js";

app.listen(env.PORT, (error) => {
  if (error) throw error;
  console.log(`API listening on http://localhost:${env.PORT}`);
});
