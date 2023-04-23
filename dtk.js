// Copyright (C) 2023 Tomoyuki Fujimori <moyu@dromozoa.com>
//
// This file is part of dromozoa-toolkit.
//
// dromozoa-toolkit is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// dromozoa-toolkit is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with dromozoa-toolkit. If not, see <https://www.gnu.org/licenses/>.

/* jshint esversion: 8 */

import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm';

const requestAnimationFrame = () => new Promise(resolve => {
  return globalThis.requestAnimationFrame(resolve);
});

const setTimeout = (delay, ...params) => new Promise(resolve => {
  return globalThis.setTimeout(resolve, delay, ...params);
});

const numberToCssRegex = /\.?0*$/;
const numberToCss = (v, unit = "px") => {
  if (Math.abs(v) < 0.00005) {
    return "0";
  } else {
    return v.toFixed(4).replace(numberToCssRegex, "") + unit;
  }
};

//-------------------------------------------------------------------------

const FrameRate = class {
  constructor(size) {
    this.size = size;
    this.frameCount = 0;
    this.frameRates = [];
    this.previousTimestamp = undefined;
  }

  update(timestamp) {
    if (this.previousTimestamp === undefined) {
      this.previousTimestamp = timestamp;
      return false;
    }
    ++this.frameCount;
    const duration = timestamp - this.previousTimestamp;
    if (duration < 1000) {
      return false;
    }
    const frameRate = this.frameCount * 1000 / duration;

    this.frameCount = 0;
    this.frameRates.push(frameRate);
    this.previousTimestamp = timestamp;
    const n = this.frameRates.length - this.size;
    if (n > 0) {
      this.frameRates.splice(0, n);
    }
    return true;
  }

  getFps() {
    return this.frameRates[this.frameRates.length - 1];
  }

  getFpsMin() {
    return this.frameRates.reduce((acc, value) => Math.min(acc, value), +Infinity);
  }

  getFpsMax() {
    return this.frameRates.reduce((acc, value) => Math.max(acc, value), -Infinity);
  }
};

//-------------------------------------------------------------------------

const images = [];

const guiObject = {
  fps: 0,
  fpsMin: 0,
  fpsMax: 0,
};

let gui;

//-------------------------------------------------------------------------

const blobToImage = blob => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(blob);

  const image = new Image();
  image.addEventListener("load", () => {
    URL.revokeObjectURL(url);
    resolve(image);
  });
  image.addEventListener("error", ev => {
    URL.revokeObjectURL(url);
    reject(ev);
  });

  image.src = url;
});

const initialize = () => {
  const rootNode = document.querySelector(".dtk-root");
  rootNode.addEventListener("dragover", ev => ev.preventDefault());
  rootNode.addEventListener("drop", async ev => {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files) {
      for (let i = 0; i < ev.dataTransfer.files.length; ++i) {
        const file = ev.dataTransfer.files.item(i);
        try {
          const image = await blobToImage(file);
          images.push(image);
        } catch (e) {
          console.error("cannot blobToImage", e);
        }
      }
    }
  });

  const canvasNode = document.createElement("canvas");
  canvasNode.classList.add("dtk-canvas");
  rootNode.append(canvasNode);

  gui = new GUI({
    container: document.querySelector(".dtk-gui"),
  });

  gui.add(guiObject, "fps").name("最新FPS");
  gui.add(guiObject, "fpsMin").name("最小FPS");
  gui.add(guiObject, "fpsMax").name("最大FPS");
};

const onResize = () => {
  const W = document.documentElement.clientWidth;
  const H = document.documentElement.clientHeight;

  const rootNode = document.querySelector(".dtk-root");
  rootNode.style.width = numberToCss(W);
  rootNode.style.height = numberToCss(H);

  const canvasNode = document.querySelector(".dtk-canvas");
  canvasNode.width = W * devicePixelRatio;
  canvasNode.height = H * devicePixelRatio;
  canvasNode.style.width = numberToCss(W);
  canvasNode.style.height = numberToCss(H);
};

document.addEventListener("DOMContentLoaded", async () => {
  initialize();
  onResize();

  addEventListener("resize", onResize);

  const frameRate = new FrameRate(60);

  while (true) {
    const timestamp = await requestAnimationFrame();
    if (frameRate.update(timestamp)) {
      guiObject.fps = Math.round(frameRate.getFps());
      guiObject.fpsMin = Math.round(frameRate.getFpsMin());
      guiObject.fpsMax = Math.round(frameRate.getFpsMax());
      gui.controllersRecursive().forEach(controller => controller.updateDisplay());
    }

    const image = images[0];
    if (image) {
      const W = document.documentElement.clientWidth;
      const H = document.documentElement.clientHeight;

      const canvas = document.querySelector(".dtk-canvas");
      const context = canvas.getContext("2d");
      context.resetTransform();
      context.scale(devicePixelRatio, devicePixelRatio);
      context.clearRect(0, 0, W, H);
      context.drawImage(image, 0, 0);
    }
  }
});
