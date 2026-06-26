const defaultCharts = {
  "排列三-基本走势": {
    issues: ["26137","26138","26139","26140","26141","26142","26143","26144","26145","26146","26147","26148","26149","26150","26151","26152","26153","26154","26155","26156","26157","26158","26159","26160","26161","26162","26163"],
    prizes: ["544","263","198","421","215","916","744","462","993","154","590","065","325","340","983","151","389","473","485","641","830","911","557","551","562","369","346"],
    sums: [13,11,18,7,8,16,15,12,21,10,14,11,10,7,20,7,20,14,17,11,11,11,17,11,13,18,13],
    hits: [5,2,1,4,2,9,7,4,9,1,5,0,3,3,9,1,3,4,4,6,8,9,5,5,5,3,3],
    green: [0,6,8,15,21,22,23],
    overrides: {}
  },
  "福彩3D-基本走势": {
    issues: ["2026137","2026138","2026139","2026140","2026141","2026142","2026143","2026144","2026145","2026146","2026147","2026148","2026149","2026150","2026151","2026152","2026153","2026154","2026155","2026156","2026157","2026158","2026159","2026160","2026161","2026162","2026163"],
    prizes: ["165","790","286","285","397","894","376","726","279","464","712","408","696","720","631","220","887","377","409","162","327","178","995","332","529","585","537"],
    sums: [12,16,16,15,19,21,16,15,18,14,10,12,21,9,10,4,23,17,13,9,12,16,23,8,16,18,15],
    hits: [1,7,2,2,3,8,3,7,2,4,7,4,6,7,6,2,8,3,4,1,3,1,9,3,5,5,5],
    green: [9,12,15,16,17,22,23,25],
    overrides: {}
  }
};

const dims = { left1: 76, left2: 64, left3: 52, digit: 34, head: 42, row: 38 };
const storageKey = "mobile-lottery-editor-v1";

let charts = loadCharts();
let currentName = "排列三-基本走势";
let period = 20;
let drawEnabled = true;

const chartSelect = document.getElementById("chartSelect");
const gridLayer = document.getElementById("gridLayer");
const trendTable = document.getElementById("trendTable");
const trendLines = document.getElementById("trendLines");
const drawButton = document.getElementById("drawButton");
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const addButton = document.getElementById("addButton");
const clearButton = document.getElementById("clearButton");
const deleteLastButton = document.getElementById("deleteLastButton");
const toast = document.getElementById("toast");
const installTip = document.getElementById("installTip");

function loadCharts() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved || structuredClone(defaultCharts);
  } catch {
    return structuredClone(defaultCharts);
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(charts));
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function cell(className, text, x, y, w, h) {
  const div = document.createElement("div");
  div.className = `cell ${className}`;
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  div.style.width = `${w}px`;
  div.style.height = `${h}px`;
  div.textContent = text;
  return div;
}

function editableCell(className, text, x, y, w, h, field, row) {
  const div = cell(`${className} editable`, text, x, y, w, h);
  div.contentEditable = "true";
  div.spellcheck = false;
  div.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      div.blur();
    }
  });
  div.addEventListener("blur", () => {
    const chart = charts[currentName];
    const value = div.textContent.trim();
    if (field === "issues") chart.issues[row] = value;
    if (field === "prizes") {
      chart.prizes[row] = value;
      chart.sums[row] = sumPrize(value);
      chart.hits[row] = firstDigit(value);
    }
    if (field === "sums") chart.sums[row] = Number(value) || value;
    persist();
    render();
  });
  return div;
}

function render() {
  const chart = charts[currentName];
  const rows = Math.min(period, chart.issues.length);
  const start = Math.max(0, chart.issues.length - rows);
  const width = dims.left1 + dims.left2 + dims.left3 + dims.digit * 10;
  const height = dims.head + dims.row * rows;
  gridLayer.innerHTML = "";
  trendLines.innerHTML = "";
  trendTable.style.width = `${width}px`;
  trendTable.style.height = `${height}px`;
  trendLines.setAttribute("width", width);
  trendLines.setAttribute("height", height);

  ["期次", "奖号", "和值"].forEach((label, index) => {
    const widths = [dims.left1, dims.left2, dims.left3];
    const x = widths.slice(0, index).reduce((a, b) => a + b, 0);
    gridLayer.append(cell("header strong-left", label, x, 0, widths[index], dims.head));
  });
  for (let d = 0; d < 10; d += 1) {
    gridLayer.append(cell("header digit", d, dims.left1 + dims.left2 + dims.left3 + d * dims.digit, 0, dims.digit, dims.head));
  }

  const points = [];
  for (let visibleRow = 0; visibleRow < rows; visibleRow += 1) {
    const r = start + visibleRow;
    const y = dims.head + visibleRow * dims.row;
    const alt = visibleRow % 2 ? " alt" : "";
    const green = chart.green.includes(r) ? " highlight" : "";
    gridLayer.append(editableCell(`strong-left${alt}`, chart.issues[r], 0, y, dims.left1, dims.row, "issues", r));
    gridLayer.append(editableCell(`strong-left${alt}${green}`, chart.prizes[r], dims.left1, y, dims.left2, dims.row, "prizes", r));
    gridLayer.append(editableCell(`strong-left${alt}`, chart.sums[r], dims.left1 + dims.left2, y, dims.left3, dims.row, "sums", r));
    for (let d = 0; d < 10; d += 1) {
      const x = dims.left1 + dims.left2 + dims.left3 + d * dims.digit;
      const hit = chart.hits[r] === d;
      const digitCell = cell(`digit${alt}${hit ? " hit" : ""}`, hit ? d : "", x, y, dims.digit, dims.row);
      digitCell.addEventListener("click", () => moveHit(r, d));
      gridLayer.append(digitCell);
      if (hit) points.push({ x: x + dims.digit / 2, y: y + dims.row / 2 });
    }
  }
  if (drawEnabled) drawLines(points);
}

function drawLines(points) {
  for (let i = 0; i < points.length - 1; i += 1) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", points[i].x);
    line.setAttribute("y1", points[i].y);
    line.setAttribute("x2", points[i + 1].x);
    line.setAttribute("y2", points[i + 1].y);
    line.setAttribute("stroke", "#f43b46");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    trendLines.append(line);
  }
}

function moveHit(row, digit) {
  charts[currentName].hits[row] = digit;
  persist();
  render();
}

function sumPrize(value) {
  return String(value).split("").reduce((sum, ch) => sum + (Number(ch) || 0), 0);
}

function firstDigit(value) {
  const match = String(value).match(/\d/);
  return match ? Number(match[0]) : 0;
}

function addRow() {
  const chart = charts[currentName];
  chart.issues.push("");
  chart.prizes.push("");
  chart.sums.push("");
  chart.hits.push(0);
  chart.green.push(chart.issues.length - 1);
  period = Math.max(period, Math.min(50, chart.issues.length));
  document.querySelectorAll(".period").forEach((item) => item.classList.toggle("active", Number(item.dataset.period) === period));
  persist();
  render();
  showToast("已新增空白行，直接在表格里填");
}

chartSelect.addEventListener("change", () => {
  currentName = chartSelect.value;
  render();
});

document.querySelectorAll(".period").forEach((button) => {
  button.addEventListener("click", () => {
    const next = Number(button.dataset.period);
    if (!next) return;
    period = next;
    document.querySelectorAll(".period").forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

drawButton.addEventListener("click", () => {
  drawEnabled = !drawEnabled;
  drawButton.classList.toggle("active", drawEnabled);
  drawButton.textContent = drawEnabled ? "画线开" : "画线关";
  render();
});

addButton.addEventListener("click", addRow);

deleteLastButton.addEventListener("click", () => {
  const chart = charts[currentName];
  if (!chart.issues.length || !confirm("删除最后一期？")) return;
  chart.issues.pop();
  chart.prizes.pop();
  chart.sums.pop();
  chart.hits.pop();
  persist();
  render();
});

clearButton.addEventListener("click", () => {
  if (!confirm("清空本地修改并恢复初始数据？")) return;
  charts = structuredClone(defaultCharts);
  persist();
  render();
  showToast("已恢复初始数据");
});

exportButton.addEventListener("click", async () => {
  const payload = JSON.stringify(charts, null, 2);
  try {
    await navigator.clipboard.writeText(payload);
    showToast("已复制数据");
  } catch {
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lottery-data.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("已下载数据文件");
  }
});

importButton.addEventListener("click", () => {
  const payload = prompt("粘贴导出的 JSON 数据");
  if (!payload) return;
  try {
    const next = JSON.parse(payload);
    if (!next["排列三-基本走势"] || !next["福彩3D-基本走势"]) throw new Error("bad");
    charts = next;
    persist();
    render();
    showToast("导入成功");
  } catch {
    showToast("导入失败");
  }
});

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
  installTip.style.display = "none";
}
