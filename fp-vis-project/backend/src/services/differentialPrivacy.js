export function applyDifferentialPrivacy(data, epsilon = 0.5) {
  const sensitivity = 1;
  const scale = sensitivity / epsilon;
  
  const noisyData = {};
  
  for (const [key, value] of Object.entries(data)) {
    const noise = sampleLaplace(scale);
    noisyData[key] = Math.max(0, Math.round(value + noise));
  }
  
  return noisyData;
}

function sampleLaplace(scale) {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}
