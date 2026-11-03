export function sha256Hex(input) {
  const buf = crypto.subtle.digest ? crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)) : Buffer.from(crypto.createHash('sha256').update(input).digest());
  // For simplicity, return hex when possible; actual usage may vary.
  if (buf instanceof ArrayBuffer) {
    const uint8 = new Uint8Array(buf);
    let hex = '';
    for (let i = 0; i < uint8.length; i++) hex += uint8[i].toString(16).padStart(2, '0');
    return hex;
  }
  return buf.toString('hex');
}

export function hmacSign(key, method, path, body, timestamp) {
  const crypto = require('crypto');
  const message = `${method}\n${path}\n${crypto.createHash('sha256').update(body).digest('hex')}\n${timestamp}`;
  const hmac = crypto.createHmac('sha256', key).update(message).digest('base64');
  return hmac;
}