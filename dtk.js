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

const canvasObject = {
  image: undefined,
  mouseDown: undefined,
  rubberBand: undefined,
};

const toolLabels = {
  "移動 (V)": "move",
  "矩形選択 (M)": "select",
  "拡大縮小 (Z)": "zoom",
};

const toolCursors = {
  move: "move",
  select: "crosshair",
  zoom: "zoom-in",
};

const guiObject = {
  fps: 0,
  fpsMin: 0,
  fpsMax: 0,
  tool: "move",
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

const updateRubberBand = ev => {
  const { x: sx, y: sy } = canvasObject.mouseDown;
  const x = ev.offsetX;
  const y = ev.offsetY;
  const rubberBand = canvasObject.rubberBand;
  rubberBand.x = Math.min(sx, x);
  rubberBand.y = Math.min(sy, y);
  rubberBand.w = Math.abs(x - sx);
  rubberBand.h = Math.abs(y - sy);
};

const updateGui = () => {
  gui.controllersRecursive().forEach(controller => controller.updateDisplay());
};

const changeTool = tool => {
  document.querySelector(".dtk-canvas").style.cursor = toolCursors[tool];
};

const updateTool = tool => {
  guiObject.tool = tool;
  updateGui();
  changeTool(tool);
};

const initialize = () => {
  const rootNode = document.querySelector(".dtk-root");
  rootNode.addEventListener("dragover", ev => ev.preventDefault());
  rootNode.addEventListener("drop", async ev => {
    ev.preventDefault();
    if (ev.dataTransfer && ev.dataTransfer.files) {
      for (let i = 0; i < ev.dataTransfer.files.length; ++i) {
        const file = ev.dataTransfer.files.item(i);
        try {
          canvasObject.image = await blobToImage(file);
        } catch (e) {
          console.error("cannot blobToImage", e);
        }
      }
    }
  });

  const canvasNode = document.createElement("canvas");
  canvasNode.classList.add("dtk-canvas");
  canvasNode.addEventListener("mousedown", ev => {
    const x = ev.offsetX;
    const y = ev.offsetY;
    canvasObject.mouseDown = { x: x, y: y };
    canvasObject.rubberBand = { x: x, y: y, w: 0, h: 0 };
  });
  canvasNode.addEventListener("mousemove", ev => {
    if (canvasObject.mouseDown) {
      updateRubberBand(ev);
    }
  });
  canvasNode.addEventListener("mouseup", ev => {
    if (canvasObject.mouseDown) {
      updateRubberBand(ev);
      canvasObject.mouseDown = undefined;
    }
  });
  rootNode.append(canvasNode);

  gui = new GUI({
    container: document.querySelector(".dtk-gui"),
  });

  gui.add(guiObject, "fps").name("最新FPS");
  gui.add(guiObject, "fpsMin").name("最小FPS");
  gui.add(guiObject, "fpsMax").name("最大FPS");
  gui.add(guiObject, "tool", toolLabels).name("ツール").onChange(changeTool);
};

const onKeyDown = ev => {
  switch (ev.code) {
    case "KeyV":
      ev.preventDefault();
      updateTool("move");
      break;
    case "KeyM":
      ev.preventDefault();
      updateTool("select");
      break;
    case "KeyZ":
      ev.preventDefault();
      updateTool("zoom");
      break;
  }
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

const draw = () => {
  const W = document.documentElement.clientWidth;
  const H = document.documentElement.clientHeight;

  const canvas = document.querySelector(".dtk-canvas");
  const context = canvas.getContext("2d");
  context.strokeStyle = "#F00";
  context.lineWidth = 1 / devicePixelRatio;

  context.resetTransform();
  context.scale(devicePixelRatio, devicePixelRatio);
  context.clearRect(0, 0, W, H);

  const image = canvasObject.image;
  if (image) {
    context.drawImage(image, 0, 0);
  }

  const rubberBand = canvasObject.rubberBand;
  if (rubberBand) {
    const { x, y, w, h } = rubberBand;
    context.strokeRect(x, y, w, h);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  initialize();
  onResize();

  addEventListener("keydown", onKeyDown);
  addEventListener("resize", onResize);

  const frameRate = new FrameRate(60);

  while (true) {
    const timestamp = await requestAnimationFrame();
    if (frameRate.update(timestamp)) {
      guiObject.fps = Math.round(frameRate.getFps());
      guiObject.fpsMin = Math.round(frameRate.getFpsMin());
      guiObject.fpsMax = Math.round(frameRate.getFpsMax());
      updateGui();
    }
    draw();
  }
});
