const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  isDesktopApp: true
});
