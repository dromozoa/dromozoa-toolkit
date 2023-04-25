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

const numberToCssRegex = /\.?0*$/;
const numberToCss = (v, unit = "px") => {
  if (Math.abs(v) < 0.00005) {
    return "0";
  } else {
    return v.toFixed(4).replace(numberToCssRegex, "") + unit;
  }
};

//-------------------------------------------------------------------------

const Tuple2 = class {
  constructor(...params) {
    this.set(...params);
  }

  set(A, y) {
    if (A === undefined) {
      return this.set(0, 0);
    } else if (y === undefined) {
      return this.set(A.x, A.y);
    } else {
      this.x = A;
      this.y = y;
      return this;
    }
  }

  add(A, B) {
    if (B === undefined) {
      B = A;
      A = this;
    }
    return this.set(A.x + B.x, A.y + B.y);
  }

  sub(A, B) {
    if (B === undefined) {
      B = A;
      A = this;
    }
    return this.set(A.x - B.x, A.y - B.y);
  }

  scale(s, A) {
    if (A === undefined) {
      A = this;
    }
    return this.set(s * A.x, s * A.y);
  }

  absolute(A) {
    if (A === undefined) {
      A = this;
    }
    return this.set(Math.abs(A.x), Math.abs(A.y));
  }

  round(A) {
    if (A === undefined) {
      A = this;
    }
    return this.set(Math.round(A.x), Math.round(A.y));
  }

  clamp(min, max, A) {
    if (A === undefined) {
      A = this;
    }
    let { x, y } = A;
    if (typeof min === "number") {
      x = Math.max(x, min);
      y = Math.max(y, min);
    } else {
      x = Math.max(x, min.x);
      y = Math.max(y, min.y);
    }
    if (typeof max === "number") {
      x = Math.min(x, max);
      y = Math.min(y, max);
    } else {
      x = Math.min(x, max.x);
      y = Math.min(y, max.y);
    }
    return this.set(x, y);
  }
};

const Point2 = class extends Tuple2 {
  get z() {
    return 1;
  }

  clone() {
    return new Point2(this);
  }

  distanceSquared(A) {
    const x = A.x - this.x;
    const y = A.y - this.y;
    return x * x + y * y;
  }
};

const Vector2 = class extends Tuple2 {
  get z() {
    return 0;
  }

  clone() {
    return new Vector2(this);
  }

  lengthSquared() {
    const { x, y } = this;
    return x * x + y * y;
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
    if (A === undefined) {
      return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    } else if (m12 === undefined) {
      return this.set(A.m11, A.m12, A.m13, A.m21, A.m22, A.m23, A.m31, A.m32, A.m33);
    } else {
      this.m11 = A;   this.m12 = m12; this.m13 = m13;
      this.m21 = m21; this.m22 = m22; this.m23 = m23;
      this.m31 = m31; this.m32 = m32; this.m33 = m33;
      return this;
    }
  }

  setIdentity() {
    return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  invert(A) {
    if (A === undefined) {
      A = this;
    }
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

  transform(A, B) {
    if (B === undefined) {
      B = A;
    }
    const { x, y, z } = A;
    return B.set(
      this.m11 * x + this.m12 * y + this.m13 * z,
      this.m21 * x + this.m22 * y + this.m23 * z,
      this.m31 * x + this.m32 * y + this.m33 * z);
  }
};

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

const canvasToBlob = (canvas, ...params) => new Promise(resolve => {
  return canvas.toBlob(resolve, ...params);
});

const CanvasObject = class {
  constructor() {
    this.canvas = undefined;
    this.canvasSize = new Vector2();
    this.tool = undefined;
    this.imageFillStyle = undefined;
    this.imageName = undefined;
    this.image = undefined;
    this.imageSize = new Vector2();
    this.transform = new Matrix3().setIdentity();
    this.mouse = undefined;
    this.rubberBandStyle = undefined;
    this.rubberBandStart = undefined;
    this.rubberBand = [ new Point2(), new Vector2() ];
    this.modifier = undefined;
    this.modifierStart = undefined;
    this.aspectRatio = undefined;
  }

  initialize() {
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("dtk-canvas");
    this.canvas.setAttribute("tabindex", "-1");
    this.canvas.addEventListener("mousedown", ev => this.mouseDown(ev));
    this.canvas.addEventListener("mousemove", ev => this.mouseMove(ev));
    this.canvas.addEventListener("mouseup", ev => this.mouseUp(ev));
    this.canvas.addEventListener("wheel", ev => this.wheel(ev));
    return this.canvas;
  }

  focus() {
    this.canvas.focus();
  }

  resize(width, height) {
    this.canvas.width = width * devicePixelRatio;
    this.canvas.height = height * devicePixelRatio;
    this.canvas.style.width = numberToCss(width);
    this.canvas.style.height = numberToCss(height);
    this.canvasSize.set(width, height);
  }

  setTool(tool) {
    this.tool = tool;
    this.canvas.style.cursor = "default";
  }

  setImageFillStyle(imageFillStyle) {
    this.imageFillStyle = imageFillStyle;
  }

  setImage(imageName, image) {
    this.imageName = imageName;
    this.image = image;
    this.imageSize.set(this.image.naturalWidth, this.image.naturalHeight, 0);

    const s = Math.min(this.canvasSize.x / this.imageSize.x, this.canvasSize.y / this.imageSize.y, 1);
    const u = this.canvasSize.clone().scale(0.5);
    const v = this.imageSize.clone().scale(0.5 * s);
    u.sub(v);
    this.transform.set(s, 0, u.x, 0, s, u.y, 0, 0, 1);

    guiObject.imageName = canvasObject.imageName;
    guiObject.imageWidth = canvasObject.imageSize.x;
    guiObject.imageHeight = canvasObject.imageSize.y;
    updateGui();
  }

  setRubberBandStyle(rubberBandStyle) {
    this.rubberBandStyle = rubberBandStyle;
  }

  setRubberBand() {
    this.rubberBand[0].set(guiObject.rubberBandX, guiObject.rubberBandY);
    this.rubberBand[1].set(guiObject.rubberBandWidth, guiObject.rubberBandHeight);
  }

  setAspectRatio() {
    if (guiObject.aspectConstraint) {
      this.aspectRatio = guiObject.width / guiObject.height;
    } else {
      this.aspectRatio = undefined;
    }
  }

  updateRubberBand() {
    const [ p, s ] = this.rubberBand;

    if (s.y < 0) {
      p.y += s.y;
    }
    if (s.x < 0) {
      p.x += s.x;
    }
    s.absolute();

    guiObject.rubberBandX = p.x;
    guiObject.rubberBandY = p.y;
    guiObject.rubberBandWidth = s.x;
    guiObject.rubberBandHeight = s.y;
    updateGui();
  }

  getModifier(ev) {
    const R = 8 / this.transform.m11;
    const R2 = R * R;

    const [ p, s ] = this.rubberBand;
    if (s.lengthSquared() > 0) {
      const A = this.transform.clone().invert();
      const u = new Point2(ev.offsetX, ev.offsetY);
      A.transform(u);

      const q = p.clone().add(s);
      const c = p.clone().add(q).scale(0.5);

      if (c.distanceSquared(u) <= R2) {
        return { modifier: "move", cursor: "move" };
      }
      if (p.distanceSquared(u) <= R2) {
        return { modifier: "topLeft", cursor: "nwse-resize" };
      }
      if (new Point2(q.x, p.y).distanceSquared(u) <= R2) {
        return { modifier: "topRight", cursor: "nesw-resize" };
      }
      if (new Point2(q.x, q.y).distanceSquared(u) <= R2) {
        return { modifier: "bottomRight", cursor: "nwse-resize" };
      }
      if (new Point2(p.x, q.y).distanceSquared(u) <= R2) {
        return { modifier: "bottomLeft", cursor: "nesw-resize" };
      }
      if (p.x <= u.x && u.x <= q.x) {
        if (Math.abs(u.y - p.y) <= R) {
          return { modifier: "top", cursor: "ns-resize" };
        }
        if (Math.abs(u.y - q.y) <= R) {
          return { modifier: "bottom", cursor: "ns-resize" };
        }
      }
      if (p.y <= u.y && u.y <= q.y) {
        if (Math.abs(u.x - p.x) <= R) {
          return { modifier: "left", cursor: "ew-resize" };
        }
        if (Math.abs(u.x - q.x) <= R) {
          return { modifier: "right", cursor: "ew-resize" };
        }
      }
    }
    return { modifier: undefined, cursor: "default" };
  }

  mouseDown(ev) {
    if (this.tool === "normal") {
      this.mouse = new Point2(ev.offsetX, ev.offsetY);
    } else if (this.tool === "select") {
      const A = this.transform.clone().invert();
      const u = new Point2(ev.offsetX, ev.offsetY);
      A.transform(u).round().clamp(0, this.imageSize);
      this.rubberBandStart = u;
      this.rubberBand[0].set(0, 0);
      this.rubberBand[1].set(0, 0);
      this.updateRubberBand();
    } else if (this.tool === "modify") {
      const modifier = this.getModifier(ev);
      this.modifier = modifier.modifier;
      if (this.modifier) {
        const A = this.transform.clone().invert();
        const u = new Point2(ev.offsetX, ev.offsetY);
        A.transform(u).round().clamp(0, this.imageSize);
        this.modifierStart = [ u, ...this.rubberBand.map(v => v.clone()) ];
      }
      this.canvas.style.cursor = modifier.cursor;
    }
  }

  mouseMove(ev) {
    if (this.tool === "normal") {
      if (this.mouse) {
        const { offsetX: x, offsetY: y } = ev;
        const u = new Vector2(x, y).sub(this.mouse);
        this.transform.m13 += u.x;
        this.transform.m23 += u.y;
        this.mouse.set(x, y);
      }
    } else if (this.tool === "select") {
      if (this.rubberBandStart) {
        const u = this.rubberBandStart;
        const A = this.transform.clone().invert();
        const v = new Point2(ev.offsetX, ev.offsetY);
        A.transform(v).round().clamp(0, this.imageSize);

        this.rubberBand[0].set(u);
        this.rubberBand[1].sub(v, u);
        this.updateRubberBand();
      }
    } else if (this.tool === "modify") {
      if (this.modifier) {
        const [ p, q, s ] = this.modifierStart;
        const A = this.transform.clone().invert();
        const u = new Point2(ev.offsetX, ev.offsetY);
        A.transform(u).round();
        u.sub(p);

        const [ P, S ] = this.rubberBand;
        if (this.modifier === "move") {
          P.add(q, u);
          S.set(s);
        } else if (this.modifier === "topLeft") {
          P.add(q, u);
          S.sub(s, u);
        } else if (this.modifier === "topRight") {
          P.add(q, new Vector2(0, u.y));
          S.add(s, new Vector2(u.x, -u.y));
        } else if (this.modifier === "bottomRight") {
          P.set(q);
          S.add(s, u);
        } else if (this.modifier === "bottomLeft") {
          P.add(q, new Vector2(u.x, 0));
          S.add(s, new Vector2(-u.x, u.y));
        } else if (this.modifier === "top") {
          const d = new Vector2(0, u.y);
          P.add(q, d);
          S.sub(s, d);
        } else if (this.modifier === "bottom") {
          P.set(q);
          S.add(s, new Vector2(0, u.y));
        } else if (this.modifier === "left") {
          const d = new Vector2(u.x, 0);
          P.add(q, d);
          S.sub(s, d);
        } else if (this.modifier === "right") {
          P.set(q);
          S.add(s, new Vector2(u.x, 0));
        }
        this.updateRubberBand();
      } else {
        this.canvas.style.cursor = this.getModifier(ev).cursor;
      }
    }
  }

  mouseUp(ev) {
    if (this.tool === "modify") {
      const [ p, s ] = this.rubberBand;

      const q = p.clone().add(s);
      p.clamp(0, this.imageSize);
      q.clamp(0, this.imageSize);
      s.sub(q, p);
      this.updateRubberBand();
    }

    this.mouse = undefined;
    this.rubberBandStart = undefined;
    this.modifier = undefined;
    this.modifierStart = undefined;
    this.canvas.style.cursor = "default";
  }

  wheel(ev) {
    ev.preventDefault();
    const { offsetX: x, offsetY: y, deltaY: d } = ev;

    const s = 1 - d * 0.01;
    const A = new Matrix3(1, 0, +x, 0, 1, +y, 0, 0, 1);
    const B = new Matrix3(s, 0,  0, 0, s,  0, 0, 0, 1);
    const C = new Matrix3(1, 0, -x, 0, 1, -y, 0, 0, 1);
    this.transform = A.mul(B).mul(C).mul(this.transform);
  }

  draw() {
    const context = this.canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.resetTransform();
    context.scale(devicePixelRatio, devicePixelRatio);
    context.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);

    const {
      m11, m12, m13: dx,
      m21, m22, m23: dy,
    } = this.transform;
    context.transform(m11, m21, m21, m22, dx, dy);

    if (this.image) {
      context.fillStyle = this.imageFillStyle;
      context.fillRect(0, 0, this.imageSize.x, this.imageSize.y);
      context.drawImage(this.image, 0, 0);
    }

    const [ p, s ] = this.rubberBand;
    if (s.lengthSquared() > 0) {
      context.lineWidth = 1 / m11;
      context.strokeStyle = this.rubberBandStyle;

      context.beginPath();
      context.rect(p.x, p.y, s.x, s.y);
      context.moveTo(p.x, p.y);
      context.lineTo(p.x + s.x, p.y + s.y);
      context.moveTo(p.x, p.y + s.y);
      context.lineTo(p.x + s.x, p.y);
      context.stroke();
    }
  }

  createImageDataUrl(mode) {
    const [ p, s ] = this.rubberBand;
    const canvasSize = mode === "selection" ? s : this.imageSize;

    const canvas = document.createElement("canvas");
    canvas.width = canvasSize.x;
    canvas.height = canvasSize.y;

    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.resetTransform();
    context.clearRect(0, 0, canvasSize.x, canvasSize.y);

    if (mode === "selection") {
      context.drawImage(this.image, -p.x, -p.y);
    } else if (mode === "inside") {
      context.save();
      context.beginPath();
      context.rect(p.x, p.y, s.x, s.y);
      context.clip();
      context.drawImage(this.image, 0, 0);
      context.restore();
    } else if (mode === "outside") {
      context.drawImage(this.image, 0, 0);
      context.clearRect(p.x, p.y, s.x, s.y);
    } else if (mode === "rectangle") {
      context.fillStyle = this.imageFillStyle;
      context.fillRect(p.x, p.y, s.x, s.y);
    }

    const basename = this.imageName.replace(/\.[^.]*$/, "");
    return [ `${basename}-${p.x}-${p.y}-${s.x}-${s.y}-${mode}.png`, canvas.toDataURL() ];
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

const canvasObject = new CanvasObject();

const toolLabels = {
  "通常 (1)": "normal",
  "選択 (2)": "select",
  "変形 (3)": "modify",
};

const toolKeyCodes = {
  Digit1: "normal",
  Digit2: "select",
  Digit3: "modify",
};

const guiObject = {
  tool: "normal",
  fps: 0,
  fpsMin: 0,
  fpsMax: 0,
  imageFillStyle: "#999999",
  imageName: "",
  imageWidth: 0,
  imageHeight: 0,
  rubberBandStyle: "#FF0000",
  rubberBandX: 0,
  rubberBandY: 0,
  rubberBandWidth: 0,
  rubberBandHeight: 0,
  aspectConstraint: false,
  aspectWidth: 16,
  aspectHeight: 9,
};

let gui;

//-------------------------------------------------------------------------

const updateGui = () => {
  gui.controllersRecursive().forEach(controller => controller.updateDisplay());
};

const saveImage = mode => {
  const [ name, url ] = canvasObject.createImageDataUrl(mode);
  const node = document.createElement("a");
  node.setAttribute("href", url);
  node.setAttribute("download", name);
  node.dispatchEvent(new MouseEvent("click"));
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
          canvasObject.setImage(file.name, await blobToImage(file));
        } catch (e) {
          console.error("cannot read " + file.name, e);
        }
      }
    }
  });
  rootNode.append(canvasObject.initialize());

  const guiCommands = {
    focusCanvas: () => canvasObject.focus(),
    saveImageSelection: () => saveImage("selection"),
    saveImageInside: () => saveImage("inside"),
    saveImageOutside: () => saveImage("outside"),
    saveImageRectangle: () => saveImage("rectangle"),
  };

  gui = new GUI({
    container: document.querySelector(".dtk-gui"),
  });

  gui.add(guiObject, "tool", toolLabels).name("ツール").onChange(v => canvasObject.setTool(v));
  gui.add(guiCommands, "focusCanvas").name("キャンバスにフォーカス");

  {
    const folder = gui.addFolder("FPS");
    folder.add(guiObject, "fps").name("最新FPS");
    folder.add(guiObject, "fpsMin").name("最小FPS");
    folder.add(guiObject, "fpsMax").name("最大FPS");
  }

  {
    const folder = gui.addFolder("画像");
    folder.addColor(guiObject, "imageFillStyle").name("画像背景色").onChange(v => canvasObject.setImageFillStyle(v));
    folder.add(guiObject, "imageName").name("画像ファイル名");
    folder.add(guiObject, "imageWidth").name("画像幅");
    folder.add(guiObject, "imageHeight").name("画像高さ");
  }

  {
    const folder = gui.addFolder("選択");
    folder.addColor(guiObject, "rubberBandStyle").name("選択色").onChange(v => canvasObject.setRubberBandStyle(v));
    folder.add(guiObject, "rubberBandX").name("矩形領域位置X").onChange(v => canvasObject.setRubberBand());
    folder.add(guiObject, "rubberBandY").name("矩形領域位置Y").onChange(v => canvasObject.setRubberBand());
    folder.add(guiObject, "rubberBandWidth").name("矩形領域の幅").onChange(v => canvasObject.setRubberBand());
    folder.add(guiObject, "rubberBandHeight").name("矩形領域の高さ").onChange(v => canvasObject.setRubberBand());
    folder.add(guiObject, "aspectConstraint").name("縦横比固定").onChange(v => canvasObject.setAspectRatio());
    folder.add(guiObject, "aspectWidth").name("縦横比の幅").onChange(v => canvasObject.setAspectRatio());
    folder.add(guiObject, "aspectHeight").name("縦横比の高さ").onChange(v => canvasObject.setAspectRatio());
  }

  {
    const folder = gui.addFolder("画像保存");
    folder.add(guiCommands, "saveImageSelection").name("矩形領域だけを保存");
    folder.add(guiCommands, "saveImageInside").name("矩形領域の内側を保存");
    folder.add(guiCommands, "saveImageOutside").name("矩形領域の外側を保存");
    folder.add(guiCommands, "saveImageRectangle").name("矩形領域を単色で保存");
  }

  canvasObject.setTool(guiObject.tool);
  canvasObject.setImageFillStyle(guiObject.imageFillStyle);
  canvasObject.setRubberBandStyle(guiObject.rubberBandStyle);
};

const keyDown = ev => {
  const tool = toolKeyCodes[ev.code];
  if (tool) {
    ev.preventDefault();
    guiObject.tool = tool;
    canvasObject.setTool(tool);
  }
};

const resize = () => {
  const W = document.documentElement.clientWidth;
  const H = document.documentElement.clientHeight;

  const rootNode = document.querySelector(".dtk-root");
  rootNode.style.width = numberToCss(W);
  rootNode.style.height = numberToCss(H);

  canvasObject.resize(W, H);
};

document.addEventListener("DOMContentLoaded", async () => {
  initialize();
  resize();

  addEventListener("keydown", keyDown);
  addEventListener("resize", resize);

  const frameRate = new FrameRate(60);

  while (true) {
    const timestamp = await requestAnimationFrame();
    if (frameRate.update(timestamp)) {
      guiObject.fps = Math.round(frameRate.getFps());
      guiObject.fpsMin = Math.round(frameRate.getFpsMin());
      guiObject.fpsMax = Math.round(frameRate.getFpsMax());
      updateGui();
    }

    canvasObject.draw();
  }
});
