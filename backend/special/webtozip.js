/*
name: saveweb2zip copier
base url: https://copier.saveweb2zip.com

author: xemoz
github: xemoz

fungsi: copy/clone website jadi ZIP via SaveWeb2Zip API
credit: xemoz
*/

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const AUTHOR = "xemoz";
const CREATOR = "xemoz";
const BASE = "https://copier.saveweb2zip.com";
const COPY_API = `${BASE}/api/copySite`;
const STATUS_API = (md5) => `${BASE}/api/getStatus/${encodeURIComponent(md5)}`;
const DOWNLOAD_API = (md5) =>
  `${BASE}/api/downloadArchive/${encodeURIComponent(md5)}`;

const HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Origin: BASE,
  Referer: `${BASE}/`,
};

function makeResponse({ statusCode = 200, status = true, result = null, message = null }) {
  const res = {
    statusCode,
    creator: CREATOR,
    status,
    result,
    timestamp: new Date().toISOString(),
  };
  if (message) res.message = message;
  return res;
}

async function startCopy(targetUrl, opts = {}) {
  const payload = {
    url: targetUrl,
    renameAssets: opts.renameAssets ?? false,
    saveStructure: opts.saveStructure ?? false,
    alternativeAlgorithm: opts.alternativeAlgorithm ?? false,
    mobileVersion: opts.mobileVersion ?? false,
  };

  const res = await axios.post(COPY_API, payload, {
    headers: HEADERS,
    timeout: 30000,
    validateStatus: (s) => s < 500,
  });

  return res.data;
}

async function checkStatus(md5) {
  const res = await axios.get(STATUS_API(md5), {
    headers: {
      ...HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 20000,
    validateStatus: (s) => s < 500,
  });
  return res.data;
}

function getDownloadUrl(md5) {
  return DOWNLOAD_API(md5);
}

async function downloadZip(md5, outputPath) {
  const url = getDownloadUrl(md5);

  const res = await axios.get(url, {
    responseType: "stream",
    headers: HEADERS,
    timeout: 120000,
    validateStatus: (s) => s < 500,
  });

  if (res.status !== 200) {
    throw new Error(`Gagal download ZIP (HTTP ${res.status})`);
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const writer = fs.createWriteStream(outputPath);
  const total = parseInt(res.headers["content-length"], 10) || 0;
  let downloaded = 0;

  res.data.on("data", (chunk) => {
    downloaded += chunk.length;
    const pct = total ? ((downloaded / total) * 100).toFixed(1) : "?";
    process.stdout.write(`\rDownloading ZIP... ${pct}%`);
  });

  res.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      process.stdout.write("\n");
      resolve({ filePath: outputPath, size: downloaded });
    });
    writer.on("error", reject);
    res.data.on("error", reject);
  });
}

async function waitUntilDone(md5, { interval = 3000, maxWait = 5 * 60 * 1000 } = {}) {
  const started = Date.now();

  while (true) {
    if (Date.now() - started > maxWait) {
      throw new Error("Timeout: proses copy belum selesai dalam 5 menit");
    }

    const status = await checkStatus(md5);

    if (status.isFinished) return status;
    if (status.errorText) throw new Error(status.errorText);

    await new Promise((r) => setTimeout(r, interval));
  }
}

async function copySite(targetUrl, opts = {}) {
  if (!targetUrl) throw new Error("Parameter url wajib diisi");

  const init = await startCopy(targetUrl, opts);

  if (!init.md5) throw new Error("md5 tidak ditemukan di response awal");

  let final = init;

  if (!init.isFinished) {
    final = await waitUntilDone(init.md5);
  }

  if (!final.success) {
    throw new Error(final.errorText || "Copy gagal tanpa pesan error");
  }

  return {
    status: true,
    md5: init.md5,
    copiedFilesAmount: final.copiedFilesAmount ?? 0,
    download: getDownloadUrl(init.md5),
  };
}

async function main() {
  const targetUrl = process.argv[2];
  const saveZip = process.argv.includes("--save");
  const outputArg = process.argv.find((a) => a.endsWith(".zip"));
  const output = outputArg || `./output/site_${Date.now()}.zip`;

  if (!targetUrl) {
    console.log(
      JSON.stringify(
        makeResponse({
          statusCode: 400,
          status: false,
          message: "Usage: node saveweb2zip-xemoz.js <url> [--save] [output.zip]",
        }),
        null,
        2
      )
    );
    process.exit(1);
  }

  try {
    const result = await copySite(targetUrl);

    if (saveZip) {
      const dl = await downloadZip(result.md5, output);
      result.filePath = dl.filePath;
      result.fileSize = dl.size;
    }

    console.log(
      JSON.stringify(makeResponse({ statusCode: 200, status: true, result }), null, 2)
    );
  } catch (error) {
    console.log(
      JSON.stringify(
        makeResponse({
          statusCode: 500,
          status: false,
          result: null,
          message: error.message,
        }),
        null,
        2
      )
    );
    process.exit(1);
  }
}



module.exports = {
  copySite,
  startCopy,
  checkStatus,
  downloadZip,
  getDownloadUrl,
  AUTHOR,
  CREATOR,
};