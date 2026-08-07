import { readFile, writeFile } from 'node:fs/promises';

const buildFile = new URL('../android/app/build.gradle', import.meta.url);
const versionCode = Number(process.env.BARA_VERSION_CODE);
const versionName = process.env.BARA_VERSION_NAME;

if (!Number.isInteger(versionCode) || !versionName) {
  throw new Error('BARA_VERSION_CODE and BARA_VERSION_NAME are required');
}

let source = await readFile(buildFile, 'utf8');
source = source
  .replace(/versionCode \d+/, `versionCode ${versionCode}`)
  .replace(/versionName "[^"]+"/, `versionName "${versionName}"`)
  .replace(
    'signingConfigs {\n        debug {',
    `signingConfigs {
        release {
            storeFile file(System.getenv('BARA_KEYSTORE_FILE'))
            storePassword System.getenv('BARA_KEYSTORE_PASSWORD')
            keyAlias System.getenv('BARA_KEY_ALIAS')
            keyPassword System.getenv('BARA_KEY_PASSWORD')
        }
        debug {`,
  );

const releaseStart = source.indexOf('        release {', source.indexOf('buildTypes {'));
const debugSigning = source.indexOf('signingConfig signingConfigs.debug', releaseStart);
if (releaseStart < 0 || debugSigning < 0 || !source.includes('signingConfigs {\n        release {')) {
  throw new Error('Generated Android signing layout was not recognized');
}
source = `${source.slice(0, debugSigning)}signingConfig signingConfigs.release${source.slice(
  debugSigning + 'signingConfig signingConfigs.debug'.length,
)}`;

await writeFile(buildFile, source);
