"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFont = exports.getLaunchOptions = exports.launchChromium = exports.getChromiumArgs = void 0;
const fs_1 = require("fs");
const fs = require("fs");
const path = require("path");
const util_1 = require("util");
const https = require("https");
const playwright = require("playwright-core");
const isLambdaRuntimeEnvironment_1 = require("./util/isLambdaRuntimeEnvironment");
const isHeadlessModeEnabled_1 = require("./util/isHeadlessModeEnabled");
const fileExists_1 = require("./util/fileExists");
const getEnvironmentVariables_1 = require("./util/getEnvironmentVariables");
const { inflate } = require('lambdafs');
/**
 * Returns a list of recommended additional Chromium flags.
 */
function getChromiumArgs(headless) {
    const result = [
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-extensions',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--disk-cache-size=33554432',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
    ];
    if (headless === true) {
        result.push('--single-process');
    }
    else {
        result.push('--start-maximized');
    }
    return result;
}
exports.getChromiumArgs = getChromiumArgs;
async function getChromiumExecutablePath(headless) {
    if (headless !== true) {
        return undefined;
    }
    if ((await fileExists_1.default('/tmp/chromium')) === true) {
        for (const file of await fs_1.promises.readdir('/tmp')) {
            if (file.startsWith('core.chromium') === true) {
                await fs_1.promises.unlink(`/tmp/${file}`);
            }
        }
        return '/tmp/chromium';
    }
    const input = path.join(__dirname, 'bin');
    const promises = [
        inflate(`${input}/chromium.br`),
        inflate(`${input}/swiftshader.tar.br`),
    ];
    if (isLambdaRuntimeEnvironment_1.default()) {
        promises.push(inflate(`${input}/aws.tar.br`));
    }
    const result = await Promise.all(promises);
    return result.shift();
}
async function launchChromium(launchOptions) {
    const options = await getLaunchOptions(launchOptions);
    const browser = await playwright.chromium.launch(options);
    return browser;
}
exports.launchChromium = launchChromium;
async function getLaunchOptions(launchOptions) {
    const headless = isHeadlessModeEnabled_1.default();
    const args = getChromiumArgs(headless);
    const executablePath = await getChromiumExecutablePath(headless);
    const env = {
        ...(await getEnvironmentVariables_1.default()),
        ...((launchOptions === null || launchOptions === void 0 ? void 0 : launchOptions.env) || {}),
    };
    return {
        args,
        executablePath,
        headless,
        env,
        ...launchOptions,
    };
}
exports.getLaunchOptions = getLaunchOptions;
exports.loadFont = async (input) => new Promise(async (resolve, reject) => {
    const url = new URL(input);
    const output = path.join(getEnvironmentVariables_1.AWS_FONT_DIR, url.pathname.split('/').pop());
    if (await util_1.promisify(fs.exists)(output)) {
        resolve();
        return;
    }
    if (!fs.existsSync(getEnvironmentVariables_1.AWS_FONT_DIR)) {
        await fs_1.promises.mkdir(getEnvironmentVariables_1.AWS_FONT_DIR);
    }
    const stream = fs.createWriteStream(output);
    stream.once('error', (error) => {
        return reject(error);
    });
    https.get(input, (response) => {
        response.on('data', (chunk) => {
            stream.write(chunk);
        });
        response.once('end', () => {
            stream.end(() => {
                return resolve();
            });
        });
    });
});
