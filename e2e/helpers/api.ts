const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const DEFAULT_POLL_INTERVAL_MS = 300;
const DEFAULT_TIMEOUT_MS = 10_000;

export async function deleteRide(token: string, rideId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/rides/${rideId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete ride ${rideId}: ${res.status}`);
  }
}

export async function deleteAvoidZone(token: string, zoneId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/avoid-zones/${zoneId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete avoid zone ${zoneId}: ${res.status}`);
  }
}

export async function getRides(token: string): Promise<{ id: string; coordinates: number[][] }[]> {
  const res = await fetch(`${API_BASE_URL}/rides`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get rides: ${res.status}`);
  }

  return res.json();
}

export async function getAvoidZones(token: string): Promise<{ id: string; coordinates: number[][] }[]> {
  const res = await fetch(`${API_BASE_URL}/avoid-zones`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get avoid zones: ${res.status}`);
  }

  return res.json();
}

export async function waitForRidesCount(
  token: string,
  expectedCount: number,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<{ id: string; coordinates: number[][] }[]> {
  const start = Date.now();
  let rides = await getRides(token);

  while (rides.length !== expectedCount && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, DEFAULT_POLL_INTERVAL_MS));
    rides = await getRides(token);
  }

  if (rides.length !== expectedCount) {
    throw new Error(
      `Timed out waiting for rides count ${expectedCount}. Received ${rides.length}`,
    );
  }

  return rides;
}

export async function waitForAvoidZonesCount(
  token: string,
  expectedCount: number,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<{ id: string; coordinates: number[][] }[]> {
  const start = Date.now();
  let zones = await getAvoidZones(token);

  while (zones.length !== expectedCount && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, DEFAULT_POLL_INTERVAL_MS));
    zones = await getAvoidZones(token);
  }

  if (zones.length !== expectedCount) {
    throw new Error(
      `Timed out waiting for avoid zones count ${expectedCount}. Received ${zones.length}`,
    );
  }

  return zones;
}
