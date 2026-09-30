/**
 * ==========================================
 * TRACAD ASSIGNMENT COVER STUDIO
 * Direct A4 PDF download + download counter
 * ==========================================
 */

/* 1. UTILITIES */
const $ = (id) => document.getElementById(id);

function getValue(id) {
  return $(id) ? $(id).value.trim() : "";
}

function safeText(value, fallback) {
  return value || fallback;
}

/* 2. CONFIGURATION & DEFAULTS */
const defaults = {
  institution: "Sylhet Agricultural University",
  department: "Department Name",
  documentType: "Assignment",
  courseName: "Extension Communication & Group Approaches",
  courseCode: "AGEXT 211",
  title: "Assignment Title",
  studentName: "Md Tahrim Kobir Riyad",
  studentId: "1234567",
  reg: "1234",
  level: "00",
  semester: "00",
  session: "2022-23",
  teacherName: "Course teacher name",
  teacherDesignation: "Designation",
  teacherUniversity: "Sylhet Agricultural University, Sylhet-3100"
};

const fields = Object.keys(defaults);

/* 3. CORE LOGIC - Update, Load, Save */
function updatePreview() {
  const institution = getValue("institution");
  const department = getValue("department");
  const student = getValue("studentName");
  const teacher = getValue("teacherName");
  const designation = getValue("teacherDesignation");
  const level = getValue("level");
  const semester = getValue("semester");
  const session = getValue("session");
  const teacherUniv = getValue("teacherUniversity");

  // Document Info
  $("previewType").textContent = getValue("documentType") || "Assignment";
  $("previewTitle").textContent = safeText(getValue("title"), "Assignment Title");
  $("previewCourseName").textContent = safeText(getValue("courseName"), "Extension Communication & Group Approaches");
  $("previewCourseCode").textContent = safeText(getValue("courseCode"), "AGEXT 211");

  // Teacher Info
  $("previewTeacher").textContent = safeText(teacher, "Course teacher name");
  $("previewDesignation").textContent = safeText(designation, "Designation");
  $("previewDepartment2").textContent = safeText(department, "Department Name");
  $("previewTeacherUniversity").textContent = safeText(teacherUniv, "Sylhet Agricultural University, Sylhet-3100");

  // Student Info
  $("previewStudent").textContent = safeText(student, "Student name");
  $("previewId").textContent = getValue("studentId") || "1234567";
  $("previewReg").textContent = getValue("reg") || "1234";
  $("previewLevel").textContent = level || "00";
  $("previewSemester").textContent = semester || "00";
  $("previewSession").textContent = session || "2022-23";

  // Footer brand
  $("docFooterBrand").textContent =
    `${safeText(institution, "SYLHET AGRICULTURAL UNIVERSITY")}, SYLHET`.toUpperCase();
}

function loadDefaults() {
  fields.forEach((id) => {
    if ($(id)) $(id).value = defaults[id];
  });
  updatePreview();
}

function saveLocal() {
  try {
    const data = {};
    fields.forEach((id) => (data[id] = getValue(id)));
    localStorage.setItem("sau_assignment_cover_data", JSON.stringify(data));
  } catch (e) {
    /* storage unavailable - ignore */
  }
}

function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem("sau_assignment_cover_data"));
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
// Backend deploy করার পর নিজের URL এখানে দিন, শেষে "/" ছাড়া
// যেমন: "https://yourname.pythonanywhere.com"
const COUNTER_API = "https://tahrim.pythonanywhere.com";

function counterEnabled() {
  return !COUNTER_API.includes("YOUR-BACKEND-URL");
}

function showCount(total) {
  const el = $("downloadCount");
  if (el && Number.isFinite(total)) el.textContent = Number(total).toLocaleString();
}

async function loadDownloadCount() {
  if (!counterEnabled()) return;
  try {
    const res = await fetch(`${COUNTER_API}/api/downloads`);
    const data = await res.json();
    showCount(data.total);
  } catch (e) {
    /* backend না পেলে "—" থাকবে, বাকি কাজ থামবে না */
  }
}

async function recordDownload() {
  if (!counterEnabled()) return;
  try {
    const res = await fetch(`${COUNTER_API}/api/downloads`, { method: "POST" });
    const data = await res.json();
    showCount(data.total);
  } catch (e) {
    /* ignore */
  }
}

/* 5. PDF PIPELINE */
const originalTitle = document.title;
let isExporting = false;

const A4_W_PX = 794;   // 210mm @ 96dpi
const A4_H_PX = 1123;  // 297mm @ 96dpi

function buildPdfName() {
  const raw = [getValue("documentType") || "Assignment", getValue("courseCode"), getValue("studentId")]
    .filter(Boolean)
    .join("_");
  return raw.replace(/[^\w\-]+/g, "_") || "Assignment_Cover";
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
    pdf.save(buildPdfName() + ".pdf");
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
  $("coverForm").addEventListener("input", () => {
    updatePreview();
    saveLocal();
  });
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
      localStorage.removeItem("sau_assignment_cover_data");
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
