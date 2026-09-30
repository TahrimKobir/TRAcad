/**
 * ==========================================
 * TRACAD ASSIGNMENT COVER STUDIO
 * PDF Generation with Native Print Engine
 * ==========================================
 * 
 * Features:
 * - No html2pdf.js (uses native browser print)
 * - Single event listeners (no duplicates)
 * - A4 210×297mm single-page output
 * - Sharp vector PDF (not screenshot)
 * - LocalStorage persistence
 * - Custom logo support
 */

/**
 * ==========================================
 * 1. UTILITY FUNCTIONS
 * ==========================================
 */
const $ = (id) => document.getElementById(id);

function getValue(id) {
  return $(id) ? $(id).value.trim() : "";
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
  teacherDesignation: "Designation",
  teacherUniversity: "Sylhet Agricultural University, Sylhet-3100"
};

const fields = Object.keys(defaults);

/**
 * ==========================================
 * 3. CORE LOGIC - Update, Load, Save
 * ==========================================
 */

/**
 * Update preview elements with current form values
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
  
  // Institutional Info (Footer brand)
  $("docFooterBrand").textContent = `${safeText(institution, "SYLHET AGRICULTURAL UNIVERSITY")}, SYLHET`.toUpperCase();
}

/**
 * Load default values into form
 */
function loadDefaults() {
  fields.forEach(id => {
    if ($(id)) $(id).value = defaults[id];
  });
  updatePreview();
}

/**
 * Save form values to localStorage
 */
function saveLocal() {
  const data = {};
  fields.forEach(id => data[id] = getValue(id));
  localStorage.setItem("sau_assignment_cover_data", JSON.stringify(data));
}

/**
 * Load form values from localStorage
 */
function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem("sau_assignment_cover_data"));
    if (!data) return false;
    fields.forEach(id => {
      if ($(id) && data[id] !== undefined) $(id).value = data[id];
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore custom logo from localStorage
 */
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
 * 4. EVENT LISTENERS (SINGLE INSTANCES)
 * ==========================================
 */

/**
 * Form input changes - update preview and save
 */
if ($("coverForm")) {
  $("coverForm").addEventListener("input", () => {
    updatePreview();
    saveLocal();
  });

  $("coverForm").addEventListener("change", () => {
    updatePreview();
    saveLocal();
  });
}

/**
 * Logo upload handler
 */
if ($("logoInput")) {
  $("logoInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
      return;
    }

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
}

/**
 * Reset button - clear all data
 */
if ($("resetBtn")) {
  $("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset all fields to default values?")) return;
    
    localStorage.removeItem("sau_assignment_cover_data");
    localStorage.removeItem("sau_custom_logo");
    
    if ($("logoInput")) $("logoInput").value = "";
    $("previewLogo").src = "favicon1.png";
    $("watermarkLogo").src = "favicon1.png";
    $("logoLabel").textContent = "Upload High-Res Logo";
    
    loadDefaults();
  });
}

/**
 * Print button - open native print dialog
 */
if ($("printBtn")) {
  $("printBtn").addEventListener("click", () => {
    window.print();
  });
}

/**
 * Download button - open print dialog for PDF save
 * Uses native browser print engine (no html2pdf.js)
 * User selects "Save as PDF" from print dialog
 */
if ($("downloadBtn")) {
  $("downloadBtn").addEventListener("click", async () => {
    const button = $("downloadBtn");
    const originalHtml = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = "Opening Print Dialog…";

    try {
      // Optional: Log PDF generation (if you have an API endpoint)
      // await logPdfGeneration();
      
      // Trigger the browser's native print dialog
      // User will select "Save as PDF" to export as vector PDF
      window.print();
    } catch (error) {
      console.error("Print dialog error:", error);
      alert("Could not open print dialog. Please use the Print button instead.");
    } finally {
      // Restore button state after print dialog closes
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  });
}

/**
 * ==========================================
 * 5. INITIALIZATION (SINGLE INSTANCE)
 * ==========================================
 * 
 * This runs once when DOM is ready.
 * No duplicate initialization.
 */
window.addEventListener("DOMContentLoaded", () => {
  // Load saved data or defaults
  if (!loadLocal()) {
    loadDefaults();
  } else {
    updatePreview();
  }
  
  // Restore custom logo if saved
  restoreLogo();
  
  console.log("✓ TRAcad Assignment Cover Studio initialized");
});
