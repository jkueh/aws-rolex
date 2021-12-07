if (typeof browser === "undefined") {
  browser = chrome; // maintain cross browser compatibility
}

const storageSet = (key, value) => {
  return new Promise((resolve) => {
    browser.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
};

const storageGet = (key) => {
  return new Promise((resolve) => {
    browser.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
};

document.getElementById('file-selector').addEventListener('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onloadend = (event) => {
    storageSet("options", { imgBlob: reader.result }).then(() => {
      document.getElementById("img-preview").src = event.target.result;
    });
  }
  reader.readAsDataURL(file);
});

storageGet("options").then((options) => {
  if (!!options && !!options.imgBlob) {
    document.getElementById("img-preview").src = options.imgBlob;
  }
});