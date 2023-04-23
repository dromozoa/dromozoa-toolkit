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

const Matrix3 = class {
  constructor(...params) {
    this.set(...params);
  }

  clone() {
    return new Matrix3(this);
  }

  set(A, m12, m13, m21, m22, m23, m31, m32, m33) {
    if (m12 === undefined) {
      const { m11, m12, m13, m21, m22, m23, m31, m32, m33 } = A;
      this.m11 = m11; this.m12 = m12; this.m13 = m13;
      this.m21 = m21; this.m22 = m22; this.m23 = m23;
      this.m31 = m31; this.m32 = m32; this.m33 = m33;
      return this;
    } else {
      const m11 = A;
      this.m11 = m11; this.m12 = m12; this.m13 = m13;
      this.m21 = m21; this.m22 = m22; this.m23 = m23;
      this.m31 = m31; this.m32 = m32; this.m33 = m33;
      return this;
    }
  }

  setIdentity() {
    return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  invert(A = this) {
    const { m11, m12, m13, m21, m22, m23, m31, m32, m33 } = A;
    const a = m22 * m33 - m23 * m32;
    const b = m23 * m31 - m21 * m33;
    const c = m21 * m32 - m22 * m31;
    const d = m11 * a + m12 * b + m13 * c;
    if (d !== 0) {
      const s = 1 / d;
      return this.set(
        a * s, (m13 * m32 - m12 * m33) * s, (m12 * m23 - m13 * m22) * s,
        b * s, (m11 * m33 - m13 * m31) * s, (m13 * m21 - m11 * m23) * s,
        c * s, (m12 * m31 - m11 * m32) * s, (m11 * m22 - m12 * m21) * s);
    }
  }

  mul(A, B) {
    if (B === undefined) {
      B = A;
      A = this;
    }
    const {
      m11: a11, m12: a12, m13: a13,
      m21: a21, m22: a22, m23: a23,
      m31: a31, m32: a32, m33: a33,
    } = A;
    const {
      m11: b11, m12: b12, m13: b13,
      m21: b21, m22: b22, m23: b23,
      m31: b31, m32: b32, m33: b33,
    } = B;
    return this.set(
      a11 * b11 + a12 * b21 + a13 * b31,
      a11 * b12 + a12 * b22 + a13 * b32,
      a11 * b13 + a12 * b23 + a13 * b33,
      a21 * b11 + a22 * b21 + a23 * b31,
      a21 * b12 + a22 * b22 + a23 * b32,
      a21 * b13 + a22 * b23 + a23 * b33,
      a31 * b11 + a32 * b21 + a33 * b31,
      a31 * b12 + a32 * b22 + a33 * b32,
      a31 * b13 + a32 * b23 + a33 * b33);
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
  tool: "select",
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
  canvasObject.mouseDown = undefined;
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

  changeTool(guiObject.tool);
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
