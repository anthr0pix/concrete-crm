import { SquareClient, SquareEnvironment } from "square";

let client: SquareClient | null = null;

export function getSquareClient(): SquareClient {
  if (!client) {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      throw new Error("SQUARE_ACCESS_TOKEN environment variable is not set");
    }
    client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment:
        process.env.SQUARE_ENVIRONMENT === "sandbox"
          ? SquareEnvironment.Sandbox
          : SquareEnvironment.Production,
    });
  }
  return client;
}

export function getLocationId(): string {
  const id = process.env.SQUARE_LOCATION_ID;
  if (!id) throw new Error("SQUARE_LOCATION_ID environment variable is not set");
  return id;
}
