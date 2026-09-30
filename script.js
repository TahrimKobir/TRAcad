/**
 * ==========================================
 * TRACAD ASSIGNMENT COVER STUDIO
 * PDF via native browser print engine (vector, single A4 page)
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

/* 4. PDF / PRINT PIPELINE (single entry point) */
const originalTitle = document.title;
let isExporting = false;

// File name suggested by "Save as PDF" comes from document.title
function buildPdfName() {
  const raw = [getValue("documentType") || "Assignment", getValue("courseCode"), getValue("studentId")]
    .filter(Boolean)
    .join("_");
  return raw.replace(/[^\w\-]+/g, "_") || "Assignment_Cover";
}

// Make sure fonts + logo images are ready so the PDF matches the preview
function waitForAssets() {
  const tasks = [];
  if (document.fonts && document.fonts.ready) tasks.push(document.fonts.ready);
  document.querySelectorAll("#cover img").forEach((img) => {
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

async function exportPdf() {
  if (isExporting) return;
  isExporting = true;

  const downloadBtn = $("downloadBtn");
  const printBtn = $("printBtn");
  const originalHtml = downloadBtn ? downloadBtn.innerHTML : "";

  if (downloadBtn) {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = "Opening Print Dialog…";
  }
  if (printBtn) printBtn.disabled = true;

  try {
    updatePreview();
    await waitForAssets();
    document.title = buildPdfName();
    window.print(); // user picks "Save as PDF" -> sharp vector PDF
  } catch (error) {
    console.error("Print dialog error:", error);
    alert("Could not open print dialog. Please try again.");
  } finally {
    document.title = originalTitle;
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = originalHtml;
    }
    if (printBtn) printBtn.disabled = false;
    isExporting = false;
  }
}

/* 5. EVENT LISTENERS (each registered exactly once) */

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

// Download PDF + Print share the same handler
if ($("downloadBtn")) $("downloadBtn").addEventListener("click", exportPdf);
if ($("printBtn")) $("printBtn").addEventListener("click", exportPdf);

// Safety: restore page title after the dialog closes
window.addEventListener("afterprint", () => {
  document.title = originalTitle;
});

/* 6. INITIALIZATION */
window.addEventListener("DOMContentLoaded", () => {
  if (!loadLocal()) {
    loadDefaults();
  } else {
    updatePreview();
  }
  restoreLogo();
  console.log("✓ TRAcad Assignment Cover Studio initialized");
});
