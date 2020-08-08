// Add flag on ls to show actual links with names
function list(input) {
  const { command, flags } = extractFlags(input, {
    t: "boolean",
  });
  if (flags.t) {
    return tree(command);
  }
  const path = command[0] && command[0].split("/");
  try {
    const cursor = path ? locatePath(path) : getCurrentCursor();
    if (locationType(cursor) === types.DIR) {
      return Object.entries(cursor).map(([key, value]) => {
        return {
          key,
          type: locationType(value), // Determine if dir or link
        };
      });
    }
  } catch (err) {
    return err;
  }
  return COMMANDS.ls.help;
}

function cd(input) {
  if (input.length) {
    const movement = input[0].split("/");
    let newPosition = [...position];
    for (let m of movement) {
      if (m === "..") {
        newPosition.pop();
      } else {
        const cursor = getCursor(newPosition);
        if (!cursor[m]) {
          return `no such link or directory: ${m}`;
        }
        if (locationType(cursor[m]) !== types.DIR) {
          return `not a directory: ${m}`;
        }
        newPosition.push(m);
      }
    }
    position = newPosition;
    return;
  }

  position = [];
}

function openLink(input) {
  if (input.length) {
    try {
      const path = input[0].split("/");
      const target = locatePath(input[0].split("/"));
      if (locationType(target) === types.DIR) {
        return `not a link: ${path[path.length - 1]}`;
      }
      window.open(target, "_blank");
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.open.help;
}

function touch(input) {
  if (input.length == 2) {
    const path = input[0].split("/");
    const url = input[1]; // TODO: ensure conforms to URL
    try {
      let finalUrl = url;
      if (!/^http|https:\/\//.test(url)) {
        finalUrl = "https://" + url;
      }
      const target = locatePath(path.slice(0, path.length - 1));
      target[path[path.length - 1]] = finalUrl;
      writeLinks();
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.touch.help;
}

function mkdir(input) {
  if (input.length) {
    const path = input[0].split("/");
    try {
      const target = locatePath(path.slice(0, path.length - 1));
      target[path[path.length - 1]] = {};
      writeLinks();
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.mkdir.help;
}

function theme(input) {
  if (input.length) {
    if (!THEMES.includes(input[0])) {
      return `no such theme: ${input[0]}`;
    }
    document.body.className = "";
    document.body.classList.add(input[0]);
    writeTheme(input[0]);
    return;
  }
  return { title: "Available themes:", items: THEMES };
}

function rm(input) {
  if (input.length) {
    const path = input[0].split("/");
    try {
      const target = locatePath(path.slice(0, path.length - 1));
      const linkToDelete = path[path.length - 1];
      if (!target[linkToDelete]) {
        return `no such link: ${linkToDelete}`;
      }
      if (!locationType(target[linkToDelete]) === types.LINK) {
        return `not a link: ${linkToDelete}`;
      }
      delete target[linkToDelete];
      writeLinks();
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.rm.help;
}

function rmdir(input) {
  if (input.length) {
    const path = input[0].split("/");
    try {
      const target = locatePath(path.slice(0, path.length - 1));
      const dirToDelete = path[path.length - 1];
      if (!target[dirToDelete]) {
        return `no such dir: ${dirToDelete}`;
      }
      if (!locationType(target[dirToDelete]) === types.DIR) {
        return `not a dir: ${dirToDelete}`;
      }
      delete target[dirToDelete];
      writeLinks();
      return;
    } catch (err) {
      return err;
    }
  }
  return COMMANDS.rmdir.help;
}

function clear() {
  const terminal = document.getElementById("terminal-content");
  while (terminal.firstChild) {
    terminal.removeChild(terminal.lastChild);
  }
  writePrompt();
  return true;
}

function help(input) {
  if (!input || !input.length) {
    return Object.keys(COMMANDS).map((cmd) => ({ key: cmd, type: types.LINK }));
  }
  return COMMANDS[input[0]].help;
}

function search(input) {
  const { command, flags } = extractFlags(input, {
    e: "string",
  });
  let currentSearchUrl = searchUrl;
  if (flags.e) {
    currentSearchUrl = ENGINES[flags.e] ? ENGINES[flags.e] : flags.e;
    if (!command[0]) {
      // Set saved engine to given
      searchUrl = currentSearchUrl;
      writeEngine(currentSearchUrl);
      return `Updated search engine to: ${currentSearchUrl}`;
    }
  }
  if (command && command[0]) {
    const searchString = command[0];
    window.open(currentSearchUrl + searchString, "_blank");
    return;
  }
  return COMMANDS.search.help;
}

function tree(input) {
  try {
    let target = links;
    if (input.length) {
      const path = input[0].split("/");
      target = locatePath(path);
    }
    if (locationType(target) !== types.DIR) {
      return `no such dir: ${input[0]}`;
    }
    return target;
  } catch (err) {
    return err;
  }
}

function mv(input) {
  try {
    if (input.length) {
      const sourcePath = input[0].split("/");
      // Target will contain "new" name
      const targetPath = input[1].split("/");
      const sourceParent = locateParentPath(sourcePath);
      const sourceName = sourcePath[sourcePath.length - 1];
      const target = locateParentPath(targetPath);
      const targetName = targetPath[targetPath.length - 1];
      // Assign new target
      target[targetName] = sourceParent[sourceName];
      // Remove old source
      delete sourceParent[sourceName];
      writeLinks();
    }
  } catch (err) {
    return err;
  }
}
