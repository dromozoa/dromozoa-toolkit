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

import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm';

const numberToCssRegex = /\.?0*$/;
const numberToCss = (v, unit = "px") => {
  if (Math.abs(v) < 0.00005) {
    return "0";
  } else {
    return v.toFixed(4).replace(numberToCssRegex, "") + unit;
  }
};

let gui;

const initialize = () => {
  gui = new GUI({
    container: document.querySelector(".dtk-gui"),
  });
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
});
