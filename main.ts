// HearthLedger hand-in: copy the site and its screenshots into the output
// directory and write the dossier the judge reads.
//
// This program does three things, in order, and refuses to finish if any of
// them fails:
//   1. copies app/ and screenshots/ from this repository into the output
//      directory (a clean copy: anything already there is removed first),
//   2. checks what was copied is really a hand-in — the app has an
//      index.html inside its size limits, every screenshot is a whole,
//      well-formed JPEG or PNG of a legal size, and nothing is a symlink,
//   3. builds dossier.json from the copied trees with the kit's
//      buildDossier, then reads the dossier back and checks the numbers it
//      claims: the first load stays small, the source names no outside URL,
//      no first-load reference names a file the app does not hold, and every
//      screenshot in the dossier hashes to the file on disk.
//
// It runs with the Node standard library only, writes nothing but the
// output directory, and is deterministic: the same repository always
// produces the same dossier bytes.
//
// The file is written as plain JavaScript (types live in JSDoc comments)
// so `node --check` passes on it directly, with no flags.
//
// Usage: MAKEFUN_OUTPUT_DIR=out node main.ts   (outside the grader)
// In the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// --- Limits: the gate's own caps, so a dossier built here is one the gate
// accepts. The text cap is the dossier's 160 KiB; the screenshot caps are
// the gate's 4 images of 256 KiB each; the app caps are the gate's 993
// entries / 16 MiB / 1000-byte paths.
const CAPS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  app_max_files: 993,
  app_max_bytes: 16 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

// The site must stay light on first load: the whole first load gzipped
// (gzip-9, as the dossier counts it) has to fit in this budget.
const FIRST_LOAD_GZIP_BUDGET = 20_000;
// The dossier file itself must stay under the platform's 1.5 MiB cap.
const DOSSIER_MAX_BYTES = 1_500_000;
// Screenshot geometry from the gate: long side at most 1280 px, short side
// at least 360 px.
const SHOT_LONG_SIDE_MAX = 1280;
const SHOT_SHORT_SIDE_MIN = 360;

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  throw new Error(`main.ts: ${message}`);
}

// --- Paths

function repoRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)));
}

function outputDir() {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv !== '') return resolve(fromEnv);
  return '/output';
}

// --- Copying

/**
 * @typedef {Object} CopiedTree
 * @property {number} files
 * @property {number} bytes
 */

// Copy srcDir into dstDir, file by file, refusing anything that is not a
// plain file or directory (a symlink would hand the grader a path outside
// the repository, so it is an error, not something to follow).
/**
 * @param {string} srcDir
 * @param {string} dstDir
 * @returns {CopiedTree}
 */
function copyTree(srcDir, dstDir) {
  const counted = { files: 0, bytes: 0 };
  mkdirSync(dstDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const from = join(srcDir, entry.name);
    const to = join(dstDir, entry.name);
    if (entry.isSymbolicLink()) fail(`${from}: symbolic links are not handed in`);
    if (entry.isDirectory()) {
      const sub = copyTree(from, to);
      counted.files += sub.files;
      counted.bytes += sub.bytes;
    } else if (entry.isFile()) {
      copyFileSync(from, to);
      counted.files += 1;
      counted.bytes += statSync(from).size;
    } else {
      fail(`${from}: not a regular file or directory`);
    }
  }
  return counted;
}

// --- Screenshot checks

const SHOT_NAME = /^[A-Za-z0-9._-]+$/;

/**
 * @typedef {Object} ImageFacts
 * @property {'jpeg' | 'png'} kind
 * @property {number} width
 * @property {number} height
 */

// Read width and height out of a JPEG by walking its markers to a start-of-
// frame segment, or out of a PNG's IHDR chunk. Anything that is not a whole
// JPEG or PNG, or whose dimensions cannot be read, is refused.
/**
 * @param {Buffer} bytes
 * @param {string} name
 * @returns {ImageFacts}
 */
function imageFacts(bytes, name) {
  const jpegMagic = bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
  const pngMagic =
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (jpegMagic) {
    if (bytes.length < 4 || bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
      fail(`screenshots/${name}: JPEG without its end marker, truncated?`);
    }
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) fail(`screenshots/${name}: JPEG marker expected at byte ${offset}`);
      const marker = bytes[offset + 1];
      if (marker === 0xd9) break; // end of image, no frame found
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const segmentLength = bytes.readUInt16BE(offset + 2);
      if (segmentLength < 2 || offset + 2 + segmentLength > bytes.length) {
        fail(`screenshots/${name}: JPEG segment overruns the file`);
      }
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = bytes.readUInt16BE(offset + 5);
        const width = bytes.readUInt16BE(offset + 7);
        return { kind: 'jpeg', width, height };
      }
      offset += 2 + segmentLength;
    }
    fail(`screenshots/${name}: JPEG with no start-of-frame segment`);
  }
  if (pngMagic) {
    if (bytes.length < 24 || bytes.toString('ascii', 12, 16) !== 'IHDR') {
      fail(`screenshots/${name}: PNG without an IHDR chunk`);
    }
    return { kind: 'png', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  fail(`screenshots/${name}: neither a JPEG nor a PNG`);
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function checkScreenshots(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    fail('screenshots/ is missing: an entry hands in 3 or 4 screenshots');
  }
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
  if (names.length < 3 || names.length > 4) {
    fail(`screenshots/ holds ${names.length} images, the gate wants 3 or 4`);
  }
  for (const name of names) {
    if (name.length < 1 || name.length > 128 || !SHOT_NAME.test(name) || name.startsWith('.') || name.startsWith('-')) {
      fail(`screenshots/${name}: a name is letters, digits and . _ -, 1 to 128 characters`);
    }
    const bytes = readFileSync(join(dir, name));
    if (bytes.length > CAPS.screenshots.max_bytes) {
      fail(`screenshots/${name} is ${bytes.length} bytes, over the 256 KiB cap`);
    }
    const facts = imageFacts(bytes, name);
    const longSide = Math.max(facts.width, facts.height);
    const shortSide = Math.min(facts.width, facts.height);
    if (longSide > SHOT_LONG_SIDE_MAX || shortSide < SHOT_SHORT_SIDE_MIN) {
      fail(
        `screenshots/${name} is ${facts.width}x${facts.height}: ` +
          `long side over ${SHOT_LONG_SIDE_MAX} or short side under ${SHOT_SHORT_SIDE_MIN}`,
      );
    }
  }
  return names;
}

// --- App checks

/**
 * @param {string} dir
 * @returns {CopiedTree}
 */
function checkApp(dir) {
  const index = join(dir, 'index.html');
  if (!existsSync(index) || !statSync(index).isFile()) {
    fail('app/index.html is missing');
  }
  if (statSync(index).size > 1024 * 1024) fail('app/index.html is over the 1 MiB cap');
  const counted = { files: 0, bytes: 0 };
  const walk = (at) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const full = join(at, entry.name);
      if (entry.isSymbolicLink()) fail(`${full}: symbolic links are not handed in`);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        counted.files += 1;
        counted.bytes += statSync(full).size;
      } else fail(`${full}: not a regular file or directory`);
    }
  };
  walk(dir);
  if (counted.files > CAPS.app_max_files) fail(`app/ holds ${counted.files} files, over the 993 cap`);
  if (counted.bytes > CAPS.app_max_bytes) fail(`app/ is ${counted.bytes} bytes, over the 16 MiB cap`);
  return counted;
}

// --- Dossier checks

/**
 * @typedef {Object} DossierImage
 * @property {string} name
 * @property {string} media_type
 * @property {string} sha256
 * @property {string} base64
 */

/**
 * @typedef {Object} DossierDoc
 * @property {string} schema
 * @property {number} cover
 * @property {string} text
 * @property {DossierImage[]} images
 */

/**
 * @param {Buffer} bytes
 * @returns {string}
 */
const sha256Hex = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Read the dossier back and check every number it claims, so a broken
// build fails here — loudly, before anything is submitted — instead of in
// front of the gate. Returns the first load's gzipped bytes, as the Totals
// line states them, for the summary line.
/**
 * @param {Buffer} dossierBytes
 * @param {string} outDir
 * @param {CopiedTree} appCount
 * @param {string[]} shotNames
 * @returns {number}
 */
function verifyDossier(dossierBytes, outDir, appCount, shotNames) {
  if (dossierBytes.length > DOSSIER_MAX_BYTES) {
    fail(`dossier.json is ${dossierBytes.length} bytes, over the 1.5 MiB cap`);
  }
  if (gzipSync(dossierBytes, { level: 9 }).length > DOSSIER_MAX_BYTES) {
    fail('dossier.json gzipped is over the 1.5 MiB cap');
  }
  let doc;
  try {
    doc = JSON.parse(dossierBytes.toString('utf8'));
  } catch {
    fail('dossier.json is not valid JSON');
  }
  if (doc.schema !== 'makefun/dossier/v1') fail(`dossier.json schema is ${doc.schema}, not makefun/dossier/v1`);
  if (doc.cover !== 0) fail(`dossier.json cover is ${doc.cover}, the first screenshot must be the cover`);

  const totals = doc.text.match(
    /^Totals: first load (\d+) files, (\d+) bytes gzip-9 \((\d+) raw\); later by import\(\) (\d+) files, (\d+) bytes gzip-9; whole app (\d+) files, (\d+) bytes$/m,
  );
  if (totals === null) fail('dossier text has no Totals line to check');
  const firstLoadFiles = Number(totals[1]);
  const firstLoadGzip = Number(totals[2]);
  const wholeAppFiles = Number(totals[6]);
  if (wholeAppFiles !== appCount.files) {
    fail(`dossier counts ${wholeAppFiles} app files but ${appCount.files} were copied`);
  }
  if (firstLoadFiles < 1) fail('dossier first load names no files');
  if (firstLoadGzip > FIRST_LOAD_GZIP_BUDGET) {
    fail(`first load is ${firstLoadGzip} bytes gzipped, over the ${FIRST_LOAD_GZIP_BUDGET} budget`);
  }
  const urls = doc.text.match(/^URLs in the source: (\d+)$/m);
  if (urls === null) fail('dossier text has no "URLs in the source" line to check');
  if (Number(urls[1]) !== 0) fail(`the source names ${urls[1]} outside URLs`);
  if (doc.text.includes('not in app/')) {
    fail('a first-load reference names a file the app does not hold');
  }

  if (doc.images.length !== shotNames.length) {
    fail(`dossier holds ${doc.images.length} screenshots but ${shotNames.length} were copied`);
  }
  doc.images.forEach((image, index) => {
    if (image.name !== shotNames[index]) {
      fail(`dossier image ${index} is ${image.name}, expected ${shotNames[index]}`);
    }
    const onDisk = readFileSync(join(outDir, 'screenshots', image.name));
    if (image.sha256 !== sha256Hex(onDisk)) {
      fail(`dossier hash for screenshots/${image.name} does not match the file`);
    }
    const decoded = Buffer.from(image.base64, 'base64');
    if (!decoded.equals(onDisk)) fail(`dossier bytes for screenshots/${image.name} do not match the file`);
    if (image.media_type !== 'image/jpeg' && image.media_type !== 'image/png') {
      fail(`dossier says screenshots/${image.name} is ${image.media_type}`);
    }
  });
  const textBytes = Buffer.byteLength(doc.text, 'utf8');
  if (textBytes > CAPS.text_max_bytes) fail(`dossier text is ${textBytes} bytes, over the 160 KiB cap`);
  return firstLoadGzip;
}

// --- Main

function main() {
  const root = repoRoot();
  const outDir = outputDir();
  const appSrc = join(root, 'app');
  const shotsSrc = join(root, 'screenshots');
  if (!existsSync(appSrc) || !statSync(appSrc).isDirectory()) fail('app/ is missing from the repository');
  if (!existsSync(shotsSrc) || !statSync(shotsSrc).isDirectory()) fail('screenshots/ is missing from the repository');

  // A clean output directory: stale files from an earlier run must never
  // leak into this hand-in.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const appCount = copyTree(appSrc, join(outDir, 'app'));
  const shotCount = copyTree(shotsSrc, join(outDir, 'screenshots'));

  // Check the copies, not the originals: what is checked is what is handed in.
  checkApp(join(outDir, 'app'));
  const shotNames = checkScreenshots(join(outDir, 'screenshots'));
  if (shotCount.files !== shotNames.length) {
    fail(`copied ${shotCount.files} screenshots but checked ${shotNames.length}`);
  }

  const dossierBytes = buildDossier(outDir, CAPS);
  const dossier = Buffer.from(dossierBytes.buffer, dossierBytes.byteOffset, dossierBytes.byteLength);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  const firstLoadGzip = verifyDossier(dossier, outDir, appCount, shotNames);

  // The grader runs this program twice and both runs must write the same
  // bytes, so prove it here: build the dossier a second time from the
  // output trees and refuse to finish if even one byte differs.
  const rebuilt = Buffer.from(buildDossier(outDir, CAPS));
  if (!rebuilt.equals(dossier)) fail('dossier is not deterministic across builds');

  console.log(
    `handed in ${appCount.files} app files (${appCount.bytes} bytes), ` +
      `${shotNames.length} screenshots, first load ${firstLoadGzip} bytes gzipped, ` +
      `dossier ${dossier.length} bytes -> ${outDir}`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
