/**
 * ==========================================
 * TRACAD ASSIGNMENT COVER STUDIO
 * Direct A4 PDF download + download counter
 * ==========================================
 */

/* VERSION MARKER - open browser console (F12) and look for this line to confirm the new file is loaded */
console.log("TRAcad script.js v3 loaded");

/* 1. UTILITIES */
const $ = (id) => document.getElementById(id);

function getValue(id) {
  return $(id) ? $(id).value.trim() : "";
}

function safeText(value, fallback) {
  return value || fallback;
}

// Safe way to write text into a preview element (no optional-chaining assignment)
function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

/* 2. CONFIGURATION & DEFAULTS */
const defaults = {
  // Only the badge keeps a value; everything else stays blank
  documentType: "Assignment",
  institution: "",

  // Institution, Course & Title, Teacher and Student fields stay blank - the form only shows "e.g." placeholders
  department: "",
  courseName: "",
  courseCode: "",
  title: "",
  studentName: "",
  studentId: "",
  reg: "",
  level: "",
  semester: "",
  group: "",
  session: "",
  teacherName: "",
  teacherDesignation: "",
  teacherDepartment: "",
  teacherUniversity: ""
};
const fields = Object.keys(defaults);

// New storage key (v2) so old saved values (Tanvir Ahmed, Professor, etc.) are ignored automatically
const FORM_KEY = "tracad_cover_form_v2";
const OLD_FORM_KEY = "sau_assignment_cover_data";
try { localStorage.removeItem(OLD_FORM_KEY); } catch (e) {}

/* 3. CORE LOGIC - Update, Load, Save */
function updatePreview() {
  const institution = getValue("institution");
  const department = getValue("department");

  // Document Info
  setText("previewType", getValue("documentType") || "Assignment");
  setText("previewTitle", safeText(getValue("title"), "Assignment Title"));
  setText("previewCourseName", safeText(getValue("courseName"), "Course Name"));
  setText("previewCourseCode", safeText(getValue("courseCode"), "Course Code"));

  // Teacher Info
  setText("previewTeacher", safeText(getValue("teacherName"), "Course teacher name"));
  setText("previewDesignation", safeText(getValue("teacherDesignation"), "Designation"));
  setText("previewDepartment2", safeText(department, "Department Name"));
  setText("previewTeacherUniversity", safeText(getValue("teacherUniversity"), "University Name"));

  // Student Info
  setText("previewStudent", safeText(getValue("studentName"), "Student name"));
  setText("previewId", safeText(getValue("studentId"), "1234567"));
  setText("previewReg", safeText(getValue("reg"), "1234"));
  setText("previewLevel", safeText(getValue("level"), "00"));
  setText("previewSemester", safeText(getValue("semester"), "00"));
  setText("previewGroup", safeText(getValue("group"), "A"));
  setText("previewSession", safeText(getValue("session"), "2022-23"));

  // Footer brand: exactly what is typed in University Name (upper case), nothing added automatically
  setText("docFooterBrand", safeText(institution, "University Name").toUpperCase());
}

function loadDefaults() {
  fields.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.value = defaults[id];
    // <select> with no matching option would become empty -> pick the first option (e.g. "Select designation")
    if (el.tagName === "SELECT" && el.selectedIndex === -1) el.selectedIndex = 0;
  });
  updatePreview();
}

function saveLocal() {
  try {
    const data = {};
    fields.forEach((id) => (data[id] = getValue(id)));
    localStorage.setItem(FORM_KEY, JSON.stringify(data));
  } catch (e) {
    /* storage unavailable - ignore */
  }
}

function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem(FORM_KEY));
    if (!data) return false;
    fields.forEach((id) => {
      if ($(id) && data[id] !== undefined) $(id).value = data[id];
    });
    return true;
  } catch {
    return false;
  }
}

function restoreLogo() {
  try {
    const logo = localStorage.getItem("sau_custom_logo");
    if (logo) {
      $("previewLogo").src = logo;
      $("watermarkLogo").src = logo;
      $("logoLabel").textContent = "Custom Logo Loaded";
    }
  } catch (e) {
    /* ignore */
  }
}

/* 4. DOWNLOAD COUNTER (Python backend) */
const COUNTER_API = "https://tahrim.pythonanywhere.com";
const COUNT_CACHE_KEY = "tracad_last_count";

function counterEnabled() {
  return !COUNTER_API.includes("YOUR-BACKEND-URL");
}

// Works with class="js-download-count" and the old id="downloadCount"
function paintCount(total) {
  const text = Number(total).toLocaleString();
  document.querySelectorAll(".js-download-count, #downloadCount").forEach((el) => {
    el.textContent = text;
  });
}

function showCount(total) {
  if (!Number.isFinite(total)) return;
  paintCount(total);
  try { localStorage.setItem(COUNT_CACHE_KEY, String(total)); } catch (e) {}
}

// Show the last known number instantly, without waiting for the server
function showCachedCount() {
  try {
    const raw = localStorage.getItem(COUNT_CACHE_KEY);
    if (raw !== null && Number.isFinite(Number(raw))) paintCount(Number(raw));
  } catch (e) {}
}

async function loadDownloadCount() {
  if (!counterEnabled()) return;
  showCachedCount();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${COUNTER_API}/api/downloads`, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      showCount(data.total);
      return;
    } catch (e) {
      console.warn("Counter load failed:", e);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function recordDownload() {
  if (!counterEnabled()) return;
  try {
    const res = await fetch(`${COUNTER_API}/api/downloads`, { method: "POST" });
    const data = await res.json();
    showCount(data.total);
  } catch (e) {
    console.warn("Counter update failed:", e);
  }
}

/* 5. PDF PIPELINE */
const originalTitle = document.title;
let isExporting = false;

const A4_W_PX = 794;   // 210mm @ 96dpi
const A4_H_PX = 1123;  // 297mm @ 96dpi

// File name: "<Course code> Assign Cover By TRAcad"
function buildPdfName() {
  const code = getValue("courseCode");
  const name = `${code ? code + " " : ""}Assign Cover By TRAcad`;
  return name.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
}

// Wait for fonts + images inside `root`
function waitForAssets(root) {
  const tasks = [];
  if (document.fonts && document.fonts.ready) tasks.push(document.fonts.ready);
  root.querySelectorAll("img").forEach((img) => {
    if (!img.complete) {
      tasks.push(
        new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        })
      );
    }
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
  return Promise.race([Promise.all(tasks), timeout]);
}

// Off-screen, fixed-size copy of the cover (independent of screen size/scroll/zoom)
function makeExportClone() {
  const stage = document.createElement("div");
  stage.style.cssText =
    `position:absolute;left:-10000px;top:0;width:${A4_W_PX}px;height:${A4_H_PX}px;` +
    `overflow:hidden;background:#fff;pointer-events:none;`;

  const clone = $("cover").cloneNode(true);
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  clone.style.cssText = `width:${A4_W_PX}px;height:${A4_H_PX}px;margin:0;`;

  stage.appendChild(clone);
  document.body.appendChild(stage);
  return { stage, clone };
}

// Direct A4 PDF download (no print dialog)
async function downloadPdf() {
  if (isExporting) return;
  isExporting = true;

  const btn = $("downloadBtn");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Generating PDF…";

  let stage = null;
  try {
    if (!window.html2canvas || !window.jspdf) {
      throw new Error("PDF libraries not loaded");
    }

    updatePreview();
    const made = makeExportClone();
    stage = made.stage;
    await waitForAssets(stage);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 900;

    const canvas = await window.html2canvas(made.clone, {
      scale: isMobile ? 3 : 4,     // keeps canvas within phone memory limits
      width: A4_W_PX,
      height: A4_H_PX,
      windowWidth: A4_W_PX,
      windowHeight: A4_H_PX,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297, undefined, "FAST");

    // Save with our own file name: "<Course code> Assign Cover By TRAcad.pdf"
    const pdfName = buildPdfName();
    pdf.setProperties({ title: pdfName }); // used as the name if a browser opens the PDF in a viewer
    const blobUrl = URL.createObjectURL(pdf.output("blob"));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = pdfName + ".pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

    recordDownload(); // count only successful PDFs
  } catch (error) {
    console.error("PDF download error:", error);
    alert("Direct download failed. Opening print dialog instead - choose 'Save as PDF' and paper size A4.");
    window.print();
  } finally {
    if (stage) stage.remove();
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    isExporting = false;
  }
}

// Print Document button (native print)
async function printCover() {
  updatePreview();
  await waitForAssets(document);
  document.title = buildPdfName();
  window.print();
  document.title = originalTitle;
}

/* 6. EVENT LISTENERS (each registered exactly once) */

// One listener for the whole form ("input" also fires for <select> and <textarea>)
if ($("coverForm")) {
  const onFormChange = () => {
    updatePreview();
    saveLocal();
  };
  $("coverForm").addEventListener("input", onFormChange);
  $("coverForm").addEventListener("change", onFormChange); // dropdowns (select) fire "change"
}

// Logo upload
if ($("logoInput")) {
  $("logoInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      $("previewLogo").src = e.target.result;
      $("watermarkLogo").src = e.target.result;
      $("logoLabel").textContent = file.name;
      try {
        localStorage.setItem("sau_custom_logo", e.target.result);
      } catch (err) {
        /* image too large to persist - still works for this session */
      }
      updatePreview();
    };
    reader.readAsDataURL(file);
  });
}

// Reset
if ($("resetBtn")) {
  $("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset all fields to default values?")) return;

    try {
      localStorage.removeItem(FORM_KEY);
      localStorage.removeItem("sau_custom_logo");
    } catch (e) {
      /* ignore */
    }

    if ($("logoInput")) $("logoInput").value = "";
    $("previewLogo").src = "favicon1.png";
    $("watermarkLogo").src = "favicon1.png";
    $("logoLabel").textContent = "Upload High-Res Logo";

    loadDefaults();
  });
}

// Download PDF and Print buttons
if ($("downloadBtn")) $("downloadBtn").addEventListener("click", downloadPdf);
if ($("printBtn")) $("printBtn").addEventListener("click", printCover);

// Safety: restore page title after the print dialog closes
window.addEventListener("afterprint", () => {
  document.title = originalTitle;
});

/* 7. INITIALIZATION */
window.addEventListener("DOMContentLoaded", () => {
  if (!loadLocal()) {
    loadDefaults();
  } else {
    updatePreview();
  }
  restoreLogo();
  loadDownloadCount();
  console.log("✓ TRAcad Assignment Cover Studio initialized");
});
