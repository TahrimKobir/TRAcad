/**
 * ==========================================
 * 1. UTILITY FUNCTIONS
 * ==========================================
 */
const $ = (id) => document.getElementById(id);

function getValue(id) {
  return $(id) ?$(id).value.trim() : "";
}

function safeText(value, fallback) {
  return value || fallback;
}


/**
 * ==========================================
 * 2. CONFIGURATION & DEFAULTS
 * ==========================================
 */
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
  teacherDesignation: "Designetion",
  teacherUniversity: "Sylhet Agricultural University, Sylhet-3100" // Added new field default
};

const fields = Object.keys(defaults);


/**
 * ==========================================
 * 3. CORE LOGIC (Update, Load, Save)
 * ==========================================
 */
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
  $("previewDesignation").textContent = safeText(designation, "Designetion");
  $("previewDepartment2").textContent = safeText(department, "Department Name");
  $("previewTeacherUniversity").textContent = safeText(teacherUniv, "Sylhet Agricultural University, Sylhet-3100");
  
  // Student Info
  $("previewStudent").textContent = safeText(student, "Student name");
  $("previewId").textContent = getValue("studentId") || "1234567";
  $("previewReg").textContent = getValue("reg") || "1234";
  $("previewLevel").textContent = level || "00";
  $("previewSemester").textContent = semester || "00";
  $("previewSession").textContent = session || "2022-23";
  
  // Institutional Info (Footer brand)
  $("docFooterBrand").textContent = `${safeText(institution, "SYLHET AGRICULTURAL UNIVERSITY")}, SYLHET`.toUpperCase();
}

function loadDefaults() {
  fields.forEach(id => {
    if ($(id))$(id).value = defaults[id];
  });
  updatePreview();
}

function saveLocal() {
  const data = {};
  fields.forEach(id => data[id] = getValue(id));
  localStorage.setItem("sau_assignment_cover_data", JSON.stringify(data));
}

function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem("sau_assignment_cover_data"));
    if (!data) return false;
    fields.forEach(id => {
      if ($(id) && data[id] !== undefined)$(id).value = data[id];
    });
    return true;
  } catch {
    return false;
  }
}

function restoreLogo() {
  const logo = localStorage.getItem("sau_custom_logo");
  if (logo) {
    $("previewLogo").src = logo;
    $("watermarkLogo").src = logo;
    $("logoLabel").textContent = "Custom Logo Loaded";
  }
}

/**
 * ==========================================
 * 4. EVENT LISTENERS
 * ==========================================
 */

// Form Changes
$("coverForm").addEventListener("input", () => {
  updatePreview();
  saveLocal();
});
$("coverForm").addEventListener("change", () => {
  updatePreview();
  saveLocal();
});

// Logo Upload
$("logoInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = e => {
    $("previewLogo").src = e.target.result;
    $("watermarkLogo").src = e.target.result;
    $("logoLabel").textContent = file.name;
    localStorage.setItem("sau_custom_logo", e.target.result);
    updatePreview();
  };
  reader.readAsDataURL(file);
});

// Reset Button
$("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all fields to default values?")) return;
  localStorage.removeItem("sau_assignment_cover_data");
  localStorage.removeItem("sau_custom_logo");
  $("logoInput").value = "";
  $("previewLogo").src = "favicon1.png";
  $("watermarkLogo").src = "favicon1.png";
  $("logoLabel").textContent = "Upload High-Res Logo";
  loadDefaults();
});


/**
 * ==========================================
 * 5. EXPORT AND PRINT (Actions & Analytics)
 * ==========================================
 */

// Function to track PDF downloads in your Python API
async function logPdfGeneration() {
  try {
    const res = await fetch("https://your-vercel-app.vercel.app/api/counter", {
      method: "POST"
    });
    const data = await res.json();
    console.log("Total PDFs generated globally:", data.total_generated);
  } catch (err) {
    console.warn("Could not log PDF analytics:", err);
  }
}

// Native Browser Print
$("printBtn").addEventListener("click", () => {
  window.print();
});

// Generate True Vector PDF Output (Uses native print engine for MS Word quality)
$("downloadBtn").addEventListener("click", async () => {
  const button = $("downloadBtn");
  const originalHtml = button.innerHTML;
  
  // UI Loading State
  button.disabled = true;
  button.innerHTML = "Opening Print Dialog…";

  try {
    // 1. Log the download to your Python backend analytics
    await logPdfGeneration();
    
    // 2. Trigger the browser's native high-quality PDF engine
    // (The user just selects "Save as PDF" in the dialog)
    window.print();
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Something went wrong. Please use the Print button instead.");
  } finally {
    // Revert UI Loading State
    button.disabled = false;
    button.innerHTML = originalHtml;
  }
});

/**
 * ==========================================
 * 6. INITIALIZATION
 * ==========================================
 */
window.addEventListener("DOMContentLoaded", () => {
  if (!loadLocal()) {
    loadDefaults();
  } else {
    updatePreview();
  }
  restoreLogo();
});



/**
 * ==========================================
 * 6. INITIALIZATION
 * ==========================================
 */
window.addEventListener("DOMContentLoaded", () => {
  if (!loadLocal()) {
    loadDefaults();
  } else {
    updatePreview();
  }
  restoreLogo();
});


/****PDF GENERATED BY THIS WEBSITE
*/
// Function to track PDF downloads in Python API
async function logPdfGeneration() {
  try {
    const res = await fetch("https://your-vercel-app.vercel.app/api/counter", {
      method: "POST"
    });
    const data = await res.json();
    console.log("Total PDFs generated globally:", data.total_generated);
  } catch (err) {
    console.warn("Could not log PDF analytics:", err);
  }
}

// Call inside your download handler:
$("downloadBtn").addEventListener("click", async () => {
  // ... existing PDF generation code ...
  
  // Log download to your Python backend
  logPdfGeneration();
});
