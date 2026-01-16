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

export async function runFloodSimulation(payload) {
  const res = await fetch(`http://127.0.0.1:8000/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, hours: 24 })
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

// SHAP Explainability endpoint
export async function explainPrediction(payload) {
  const res = await fetch(`http://127.0.0.1:8000/explain`, {
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

// City search endpoint
export async function searchCities(query) {
  if (!query || query.length < 1) {
    return { cities: [] };
  }
  
  const res = await fetch(
    `http://127.0.0.1:8000/cities?query=${encodeURIComponent(query)}`
  );
  
  if (!res.ok) {
    throw new Error(`Failed to search cities: ${res.status}`);
  }
  
  return await res.json();
}

// Location validation endpoint
export async function validateLocation(locationData) {
  const res = await fetch(`http://127.0.0.1:8000/validate-location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(locationData),
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

// Multi-city endpoints
export async function getMultiCitySample(limit = 10) {
  const res = await fetch(`http://127.0.0.1:8000/multi-city/sample?limit=${limit}`);
  
  if (!res.ok) {
    throw new Error(`Failed to get sample cities: ${res.status}`);
  }
  
  return await res.json();
}

export async function getMultiCityPredictions(cities) {
  const res = await fetch(`http://127.0.0.1:8000/multi-city/predictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cities }),
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