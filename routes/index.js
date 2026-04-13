import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function camelCaseToDash(myStr) {
  return myStr.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Collects every `*.route.js` file in this directory (same pattern as CommonJS `require`, but ESM-safe).
 */
function getAllRoutesPath(folderPath) {
  const allRoutesPath = [];

  if (!fs.existsSync(folderPath)) {
    return allRoutesPath;
  }

  fs.readdirSync(folderPath).forEach((file) => {
    const fullPath = path.join(folderPath, file);
    if (!file.endsWith('.route.js')) return;
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return;

    allRoutesPath.push({
      /** File URL for dynamic `import()` */
      importUrl: pathToFileURL(fullPath).href,
      fileName: file.replace(/\.route\.js$/, ''),
    });
  });

  return allRoutesPath;
}

/**
 * Mounts each default-exported Express router at `/api/v1/<kebab-case-filename>`.
 * Uses dynamic `import()` because this project is ESM (`"type": "module"`).
 */
export async function registerRoutes(expressInstance) {
  const routesFolder = __dirname;
  const normalRoutes = getAllRoutesPath(routesFolder);

  for (const routeFile of normalRoutes) {
    const mod = await import(routeFile.importUrl);
    const router = mod.default;

    if (!router) {
      console.warn(
        `Skipping ${routeFile.fileName}.route.js: default export must be an Express Router`,
      );
      continue;
    }

    expressInstance.use(
      `/api/v1/${camelCaseToDash(routeFile.fileName)}`,
      router,
    );
  }
}
