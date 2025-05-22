import axios from "axios";
import { env } from "@/config/env";

export async function geocodeAddress(address: string) {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

  const { data } = await axios.get(url);

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(`Geocoding failed: ${data.status}`);
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}
