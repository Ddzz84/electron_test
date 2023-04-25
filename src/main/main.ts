import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as url from "url";

let mainWindow: Electron.BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    title: "Arca24 GIT manager",
    backgroundColor: "#f2f2f2",
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      devTools: process.env.NODE_ENV !== "production",
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:4000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "renderer/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  ipcMain.on("selectDirectory", function () {
    if (mainWindow) {
      const dir = dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"],
      });
      // eslint-disable-next-line no-console
      console.log(dir);
      return dir;
    }
  });
  // ipcMain.on("set-title", (event, title) => {
  //   const webContents = event.sender;
  //   const win = BrowserWindow.fromWebContents(webContents);
  //   win?.setTitle(title);
  // });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
