import { app, session, shell, BrowserWindow } from 'electron';
import { format as formatUrl } from 'url';
import path from 'path';
import './routes';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default class Application {

    #api;
    #main;
    #session;

    constructor(options = {}, appApi = app) {
        this.#api = appApi;
        this.#api.on('ready', () => {
            this.#session = session.defaultSession;
            this.#session.setDownloadPath(this.#api.getPath('downloads'));
            this.createMainWindow(options).catch(err => console.error(err));
        });
        this.#api.on('activate', () => this.#main !== null || this.createMainWindow(options));
        this.#api.on('window-all-closed', () => process.platform === 'darwin' || this.#api.quit());
    }

    log(level, message) {
        console[level](message);
    }

    get whenReady() {
        return this.#api.whenReady();
    }

    async createMainWindow({ url, ...options }) {
        this.#main = new BrowserWindow(options);
        await this.#main.loadURL(url);
        this.#main.maximize();
        this.#main.on('closed', () => this.#main = null);
        isDevelopment && this.#main.webContents.openDevTools();
        this.#main.webContents.on('new-window', () => {});
    }

}

new Application({
    url: isDevelopment
        ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
        : formatUrl({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }),
    width: 1280,
    height: 768,
    minWidth: 480,
    minHeight: 320,
    webPreferences: {
        affinity: 'main',
        webSecurity: false,
        nodeIntegration: true,
        nativeWindowOpen: true,
    }
});