const { ipcRenderer } = require("electron");

const exitBtn = document.getElementById("exitBtn")
const clearBtn = document.getElementById("clearBtn")
const App = document.getElementById("App")
const date = document.getElementById("date")
const time = document.getElementById("time")
const openDisplay = document.getElementById("openDisplay")
const closeDisplay = document.getElementById("closeDisplay")
const display = document.getElementById("display")
const seperator = document.getElementById("seperator")
const memosList = document.getElementById("memosList")
const titleDisplay = document.getElementById("title-display")
const bodyArea = document.getElementById("body-area")
const tagDisplay = document.getElementById("tag-display")
const dateDisplay = document.getElementById("date-display")
const resetBtn = document.getElementById("reset-btn")
const saveBtn = document.getElementById("saveBtn")
const forgetBtn = document.getElementById("forgetBtn")
const search = document.getElementById("search")
const rememberBtn = document.getElementById("rememberBtn")
const info = document.getElementById("info")
const logo = document.getElementById("logo")
const face = document.getElementById("face")
const faces = [
  document.getElementById("f1"),
  document.getElementById("f2"),
  document.getElementById("f3"),
  document.getElementById("f4"),
  document.getElementById("f5"),
  document.getElementById("f6"),
  document.getElementById("f7"),
]

//Flags
let DISPLAY = true
let EDIT_MODE = false
let FACE = 0

//Functions
const setDisplay = (who,how) => {
  who.style.display = how
}

const setFace = (which) => {
  setDisplay(faces[FACE], "none")
  setDisplay(faces[which], "block")
  setTimeout(() => {
    face.style.animation = ""
  }, 500);
  face.style.animation = "facing 0.75s"
  FACE = which
}

const setEditMode = (mode) => {
  EDIT_MODE = mode
  if(mode)
  {
    setDisplay(dateDisplay, "block")
    dateDisplay.setAttribute("disabled", true)
    titleDisplay.setAttribute("disabled", true)
  }
  else
  {
    setDisplay(dateDisplay, "none")
    titleDisplay.removeAttribute("disabled")
  }
}

const setTime = () => {
  const [dateDisplay, timeDisplay] = dateAndTimeDisplay()
  date.innerHTML = dateDisplay
  time.innerHTML = timeDisplay
}

const changeDisplay = () => {
  setTimeout(() => {
    setFace(0)
  }, 500);
  setFace(1)
  if(DISPLAY) {
    App.style.width = "390px"
    display.style.width = "0px"
    setDisplay(display, "none")
    setDisplay(openDisplay, "block")
    setDisplay(closeDisplay, "none")
    DISPLAY = false
  } else {
    App.style.width = "1000px"
    display.style.width = "610px"
    display.style.display = "flex"
    setDisplay(openDisplay, "none")
    setDisplay(closeDisplay, "block")
    DISPLAY = true
  }
  ipcRenderer.send("display")
}

const resetDisplay = () => {
  if(!EDIT_MODE)
    titleDisplay.value = ""
  bodyArea.value = ""
  tagDisplay.value = ""
}

const fillDisplay = (title, body, tag, date) => {
  titleDisplay.value = title
  bodyArea.value = body
  tagDisplay.value = tag
  dateDisplay.value = date
}

const getInputs = () => {
  const title = titleDisplay.value
  const body = bodyArea.value
  const tag = tagDisplay.value

  if(title == "" || body == "" || tag == "")
    return [false, title, body, tag]
  else 
    return [true, title, body, tag]
}

const generateMemo = (title, body, tag, date) => {
  const memo = document.createElement("div")
  memo.classList.add("memorie")

  const Title = document.createElement("p")
  Title.classList.add("memo-title")
  Title.innerHTML = title

  const Body = document.createElement("small")
  Body.classList.add("memo-text")
  Body.innerHTML = body.slice(0, 30) + "..."

  const Tag = document.createElement("small")
  Tag.classList.add("memo-tag")
  Tag.innerHTML = tag

  const Date = document.createElement("small")
  Date.classList.add("memo-date")
  Date.innerHTML = date

  memo.appendChild(Title)
  memo.appendChild(Body)
  memo.appendChild(Tag)
  memo.appendChild(Date)

  memo.addEventListener("click", () => {
    setTimeout(() => {
      setFace(0)
    }, 3100);
    setFace(1)
    if(!DISPLAY)
      changeDisplay()
    setTimeout(() => {
      fillDisplay(title, body, tag, date)
      display.style.animation = ""
    }, 3000);
    display.style.animation = "remember 5s"
    setEditMode(true)
  })

  return memo
}

const clearMemos = () => {
  setTimeout(() => {
    ipcRenderer.send("clear_memos")
    memosList.style.animation = ""
    memosList.innerHTML = ""
  }, 2500)
  memosList.style.animation = "clear 3s"
  setTimeout(() => {
    setFace(0)
  }, 2600);
  setFace(1)
}

const convertDateFormat = (inputDate) => {
  const parsedDate = new Date(inputDate);

  const day = parsedDate.getDate();
  const month = parsedDate.getMonth() + 1; 
  const year = parsedDate.getFullYear();

  const paddedDay = day < 10 ? '0' + day : day;
  const paddedMonth = month < 10 ? '0' + month : month;

  const formattedDate = `${paddedDay}/${paddedMonth}/${year}`;

  return formattedDate;
}

const loadMemos = async () => {
  memosList.innerHTML = ""
  const memos = await ipcRenderer.invoke("get_memos")
  memos.forEach(({title, text, tag, timestamp}) => {
    memosList.appendChild(generateMemo(title, text, tag, convertDateFormat(timestamp)))
  });
}

//Init
window.onload =  () => {
  setTime();
  openDisplay.style.display = "none"
  setDisplay(dateDisplay, "none")
  faces.forEach( face => {
    setDisplay(face, "none")
  });
  setFace(0)
  loadMemos()

}

//Intervalls
const dateAndTimeDisplay = () => {
  const now = new Date()
  const todayDate = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  
  const dateDisplay = `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]}, ${todayDate}`
  
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const timeDisplay = `${hours < 10? '0' + hours : hours}:${minutes < 10? '0' + minutes: minutes}`
  
  return [dateDisplay, timeDisplay]
}


setInterval(() => {
  setTime()
}, 1000)

//EventsListners
exitBtn.addEventListener("click", () => {
  ipcRenderer.send("close_app");
})

exitBtn.addEventListener("mouseover", () => {
  setFace(5)
})

exitBtn.addEventListener("mouseleave", () => {
  setFace(0)
})
seperator.addEventListener("click", () => {
  changeDisplay()
})

face.addEventListener("click", () => {
  setTimeout(() => {
    setTimeout(() => {
      setFace(0)
    }, 1500);
    setFace(4)
  }, 2000);
  setFace(2)
})

resetBtn.addEventListener("click", () => {
  resetDisplay()
})

saveBtn.addEventListener("click", () => {
  const [ok, title, body, tag] = getInputs()
  if(ok)
  {
    setTimeout(() => {
      if(!EDIT_MODE)
      {
        ipcRenderer.send("insert_memo", title, body, tag)
      } else {
        ipcRenderer.send("edit_memo", title, body, tag)
        setEditMode(false)
      }
      display.style.animation = ""
      resetDisplay()
      loadMemos()
    }, 2000)
    display.style.animation = "save 3s"
    setTimeout(() => {
      setFace(0)
    }, 2100);
    setFace(1)
  } else {
    const tmp = bodyArea.value
    bodyArea.value = "Please all fields are required ^^"
    setTimeout(() => {
      bodyArea.value = tmp
    }, 3000);
    setTimeout(() => {
      setFace(0)
    }, 2900);
    setFace(3)
  }
})

forgetBtn.addEventListener("click", () => {
  const [ok, title, body, tag] = getInputs()
  if(ok)
  {
    setTimeout(() => {
      ipcRenderer.send("delete_memo", title)
      display.style.animation = ""
      resetDisplay()
      loadMemos()
      setEditMode(false)
    }, 1000)

    display.style.animation = "forget 3s"
    setTimeout(() => {
      setFace(0)
    }, 1100);
    setFace(1)
  } else {
    const tmp = bodyArea.value
    bodyArea.value = "Please all fields are required ^^"
    setTimeout(() => {
      bodyArea.value = tmp
    }, 3000);
    setTimeout(() => {
      setFace(0)
    }, 2900);
    setFace(3)
  }
})

clearBtn.addEventListener("click", clearMemos)

rememberBtn.addEventListener("click", async () => {
  memosList.innerHTML = ""
  const input = search.value
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  const isDate =  dateRegex.test(input);
  const memos = await ipcRenderer.invoke("search_memos",input, isDate)
  search.value = ""
  memos.forEach(({title, text, tag, timestamp})=> {
    memosList.appendChild(generateMemo(title, text, tag, convertDateFormat(timestamp)))
  });
})

info.addEventListener("click", () => {
  if(!DISPLAY)
    changeDisplay()
  const tmp = bodyArea.value
  bodyArea.value = `
  Shortcuts:
  Ctrl + Q to quit app.
  Ctrl + D to delete All Memories.
  Ctrl + W to open/close the memorie display window.
  `
  setTimeout(() => {
    bodyArea.value = tmp
  }, 5000)
})

logo.addEventListener("click", () => {
  loadMemos();
  setTimeout(() => {
    App.style.animation = ""
  }, 9000);
  App.style.animation = "logo 7s"
})

logo.addEventListener("mouseover", () => {
  setFace(6)
})

logo.addEventListener("mouseleave", () => {
  setFace(0)
})

//Shortcuts
ipcRenderer.on("clear_shortcut", () => {
  clearMemos();
})

ipcRenderer.on("chdsp_shortcut", () => {
  changeDisplay();
})