/** Build address variants for client-side geocoding (mirrors backend geocodeAddress). */
export function buildGeocodeAddressVariants(address, context = {}) {
  const base = address?.trim();
  if (!base) return [];

  const seen = new Set();
  const variants = [];
  const push = (value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    variants.push(value.trim());
  };

  push(base);

  const city = context.city?.trim();
  const state = context.state?.trim();
  const country = context.country?.trim() || "Pakistan";

  if (city && !base.toLowerCase().includes(city.toLowerCase())) {
    push(`${base}, ${city}`);
  }
  if (city && state) {
    push(`${base}, ${city}, ${state}`);
  }
  if (city) {
    push(`${base}, ${city}, ${country}`);
  }
  push(`${base}, ${country}`);

  return variants;
}

export async function geocodeAddressWithVariants(geocoder, address, context = {}) {
  if (!geocoder || !address?.trim()) return null;

  const variants = buildGeocodeAddressVariants(address, context);
  for (const variant of variants) {
    try {
      const { results } = await geocoder.geocode({
        address: variant,
        region: context.country === "Pakistan" || context.country === "PK" ? "pk" : undefined,
      });
      const loc = results?.[0]?.geometry?.location;
      if (!loc) continue;
      return { lat: loc.lat(), lng: loc.lng() };
    } catch {
      /* try next variant */
    }
  }

  return null;
}
