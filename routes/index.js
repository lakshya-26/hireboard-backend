import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES_ROOT = __dirname;

const API_PREFIX = '/api/v1';

function camelCaseToDash(myStr) {
  return myStr.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Recursively finds every `*.route.js` under `routes/` (any depth).
 * `routes/index.js` is ignored because it does not match `*.route.js`.
 */
function collectRouteFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectRouteFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.route.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * `routes/auth.route.js` → `auth`
 * `routes/foo/bar.route.js` → `foo/bar` (each segment kebab-cased)
 */
function mountSuffixFromFile(routesRoot, filePath) {
  const rel = path.relative(routesRoot, filePath);
  const normalized = rel.split(path.sep).join('/');
  const dir = path.posix.dirname(normalized);
  const base = path.basename(normalized, '.route.js');
  const segments = dir === '.' ? [base] : [...dir.split('/'), base];
  return segments.map(camelCaseToDash).join('/');
}

/**
 * Mounts each default-exported Express router at `${API_PREFIX}/<path-from-folders-and-file>`.
 */
export async function registerRoutes(expressInstance) {
  const routeFiles = collectRouteFiles(ROUTES_ROOT);

  for (const filePath of routeFiles) {
    const mod = await import(pathToFileURL(filePath).href);
    const router = mod.default;
    const mountSuffix =
      typeof mod.routeBase === 'string' && mod.routeBase.trim()
        ? mod.routeBase.trim()
        : mountSuffixFromFile(ROUTES_ROOT, filePath);

    if (!router) {
      console.warn(
        `Skipping ${path.relative(ROUTES_ROOT, filePath)}: default export must be an Express Router`,
      );
      continue;
    }

    expressInstance.use(`${API_PREFIX}/${mountSuffix}`, router);
  }
}
