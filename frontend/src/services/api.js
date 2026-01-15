export async function getLivePrediction(place) {
  const res = await fetch(
    `http://127.0.0.1:8000/predict/live?place=${place}`
  );
  return await res.json();
}

export async function get3DayForecast(place) {
  const res = await fetch(
    `http://127.0.0.1:8000/forecast/3day?place=${place}`
  );
  return await res.json();
}

export async function postPrediction(payload) {
  const res = await fetch(`http://127.0.0.1:8000/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // non-json response
  }

  if (!res.ok) {
    const msg = (body && (body.detail || body.error)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body;
}
