const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const homedir = require("os").homedir

let mainWindow;
let db;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 610,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    
   });

  mainWindow.loadFile("index.html")
  mainWindow.on('closed', () => (mainWindow = null));
}

const initDatabase = () => {
  db = new sqlite3.Database(homedir() + "/.memories.db");
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE,
      text TEXT NOT NULL,
      tag TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  });
}

const initShortcuts = () => {
  globalShortcut.register('CommandOrControl+D', () => {
    mainWindow.webContents.send("clear_shortcut")
  });
  globalShortcut.register('CommandOrControl+W', () => {
    mainWindow.webContents.send("chdsp_shortcut")
  });
}

app.whenReady().then(() => {
  initShortcuts();
  initDatabase();
  createWindow();
});

app.addListener('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("close_app", () => {
  app.quit()
})

ipcMain.on("display", () => {
  mainWindow.resizable = true;
  if(mainWindow.getSize()[0] == 1000)
    mainWindow.setSize(390,610)
  else
    mainWindow.setSize(1000,610)
  mainWindow.resizable = false;
})

ipcMain.on("insert_memo", (e, title, body, tag) => {
  const insertMemo = db.prepare('INSERT INTO memories (title, text, tag) VALUES (?, ?, ?);');
  insertMemo.run([title, body, tag]);
  insertMemo.finalize();
});


ipcMain.on("edit_memo", (e, title, body, tag) => {
  const editMemo = db.prepare('UPDATE memories SET text = ?, tag = ? WHERE title = ?')
  editMemo.run([body, tag, title]);
  editMemo.finalize();
})

ipcMain.on("delete_memo", (e, title) => {
  const deleteMemo = db.prepare('DELETE FROM memories WHERE title = ?')
  deleteMemo.run(title);
  deleteMemo.finalize();
})

ipcMain.on("clear_memos", () => {
  const clearMemos = db.prepare('DELETE FROM memories')
  clearMemos.run();
  clearMemos.finalize();
})

ipcMain.handle("get_memos", () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM memories', (err, memos) => {
      if (err) {
        reject(err);
      } else {
        resolve(memos);
      }
    });
  });
});

const transformDateFormat = (inputDate) => {
  const [day, month, year] = inputDate.split('/');

  const transformedDate = new Date(`${year}-${month}-${day}`);

  const formattedDate = transformedDate.toISOString().split('T')[0];

  return formattedDate;
}

ipcMain.handle("search_memos", (e, key, isDate) => {
  if (isDate)
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM memories WHERE date(timestamp) = date(?)',
    transformDateFormat(key), (err, memos) => {
      if (err) {
        reject(err);
      } else {
        resolve(memos);
      }
    });
  });

  else 
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM memories WHERE (title LIKE '%' || ? || '%' OR text LIKE '%' || ? || '%' OR tag LIKE '%' || ? || '%')`,
    [key, key, key], (err, memos) => {
      if (err) {
        reject(err);
      } else {
        resolve(memos);
      }
    });
  });
});
