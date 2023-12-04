import { LinearClient } from "@linear/sdk";

export const Linear = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
});
