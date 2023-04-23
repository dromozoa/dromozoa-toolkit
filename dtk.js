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

const guiObject = {
  fps: 0,
  fpsMin: 0,
  fpsMax: 0,
};

let gui;

//-------------------------------------------------------------------------

const initialize = () => {
  const node = document.querySelector(".dtk-root");
  node.addEventListener("dragover", ev => ev.preventDefault());
  node.addEventListener("drop", ev => {
    ev.preventDefault();

    // ファイル処理
  });

  gui = new GUI({
    container: document.querySelector(".dtk-gui"),
  });

  gui.add(guiObject, "fps").name("最新FPS");
  gui.add(guiObject, "fpsMin").name("最小FPS");
  gui.add(guiObject, "fpsMax").name("最大FPS");

};

const onResize = () => {
  const node = document.querySelector(".dtk-root");
  node.style.width = numberToCss(document.documentElement.clientWidth);
  node.style.height = numberToCss(document.documentElement.clientHeight);
};

document.addEventListener("DOMContentLoaded", async () => {
  onResize();
  initialize();

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
  }
});
