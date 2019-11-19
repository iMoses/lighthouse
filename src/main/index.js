import { app, session, shell, BrowserWindow } from 'electron';


export default class Application {

    #api;
    #main;
    #session;

    constructor(options = {}, appApi = app) {
        this.#api = appApi;
        this.#api.on('ready', () => {
            this.#session = session.defaultSession;
            this.#session.setDownloadPath(this.#api.getPath('downloads'));
            this.createMainWindow(options).catch(err => this.log('error', err));
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

    async createMainWindow({ file, openDevTools, ...options }) {
        this.#main = new BrowserWindow(options);
        await this.#main.loadFile(file);
        this.#main.maximize();
        this.#main.on('closed', () => this.#main = null);
        openDevTools && this.#main.webContents.openDevTools();
        this.#main.webContents.on('new-window', () => {});
    }

}

new Application({
    file: 'index.html',
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