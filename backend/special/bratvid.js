/**
 * BratVid Maker API Client
 * Author: Xemoz
 * 
 * Endpoint: https://api-xemoz-official.my.id/api/maker/bratvid.php
 * Description: Generate Brat video with custom text
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api-xemoz-official.my.id/api/maker/bratvid.php';
const AUTHOR = 'Xemoz';

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} - ${res.statusMessage}`));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Generate Brat video dari teks
 * @param {string} text - Teks yang akan dijadikan video
 * @param {string} outputPath - Path untuk menyimpan hasil video (opsional)
 * @returns {Promise<Buffer|string>} Buffer video atau path file
 */
async function bratVid(text, outputPath = null) {
  if (!text || typeof text !== 'string') {
    throw new Error('Parameter "text" wajib diisi dan harus string!');
  }

  const url = `${API_BASE}?text=${encodeURIComponent(text)}`;
  try {
    const buffer = await fetchBuffer(url);

    if (outputPath) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outputPath, buffer);
      return outputPath;
    }

    return buffer;
  } catch (err) {
    throw new Error(`[${AUTHOR}] Gagal generate BratVid: ${err.message}`);
  }
}

module.exports = { bratVid, fetchBuffer, AUTHOR };