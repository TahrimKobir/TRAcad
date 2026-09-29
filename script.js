const $ = (id) => document.getElementById(id);

// Default presets matching the reference cover image & creator details
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
  teacherDesignation: "Designetion"
};

const fields = Object.keys(defaults);

function getValue(id) {
  return $(id) ?$(id).value.trim() : "";
}

function safeText(value, fallback) {
  return value || fallback;
}

function updatePreview() {
  const institution = getValue("institution");
  const department = getValue("department");
  const student = getValue("studentName");
  const teacher = getValue("teacherName");
  const designation = getValue("teacherDesignation");
  const level = getValue("level");
  const semester = getValue("semester");
  const session = getValue("session");

  $("previewType").textContent = getValue("documentType") || "Assignment";
  $("previewTitle").textContent = safeText(getValue("title"), "Assignment Title");
  $("previewCourseName").textContent = safeText(getValue("courseName"), "Extension Communication & Group Approaches");
  $("previewCourseCode").textContent = safeText(getValue("courseCode"), "AGEXT 211");
  
  $("previewTeacher").textContent = safeText(teacher, "Course teacher name");
  $("previewDesignation").textContent = safeText(designation, "Designetion");
  $("previewDepartment2").textContent = safeText(department, "Department Name");
  
  $("previewStudent").textContent = safeText(student, "Student name");
  $("previewId").textContent = getValue("studentId") || "1234567";
  $("previewReg").textContent = getValue("reg") || "1234";
  $("previewLevel").textContent = level || "00";
  $("previewSemester").textContent = semester || "00";
  $("previewSession").textContent = session || "2022-23";
  
  $("previewFooterInstitution").textContent = safeText(institution, "Sylhet Agricultural University");
  $("previewFooterBrand").textContent = `${safeText(institution, "SYLHET AGRICULTURAL UNIVERSITY")}, SYLHET`.toUpperCase();
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

// Event Listeners for Live Updates
$("coverForm").addEventListener("input", () => {
  updatePreview();
  saveLocal();
});

$("coverForm").addEventListener("change", () => {
  updatePreview();
  saveLocal();
});

// Logo Uploader Handler
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

function restoreLogo() {
  const logo = localStorage.getItem("sau_custom_logo");
  if (logo) {
    $("previewLogo").src = logo;
    $("watermarkLogo").src = logo;
    $("logoLabel").textContent = "Custom Logo Loaded";
  }
}

// Reset Form
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

// Print Function
$("printBtn").addEventListener("click", () => {
  window.print();
});

// PDF Downloader (300 DPI High-Quality Output)
$("downloadBtn").addEventListener("click", async () => {
  const button = $("downloadBtn");
  const originalHtml = button.innerHTML;
  button.disabled = true;
  button.innerHTML = "Generating PDF…";

  // Enforced file name requested by user
  const fileName = "PPATH 312(P) Cover by TRAcad-.pdf";

  const options = {
    margin: 0,
    filename: fileName,
    image: { type: "jpeg", quality: 1.0 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: "#ffffff",
      windowWidth: 800, // Forces full render context to prevent CSS clipping
      scrollY: 0
    },
    // Using precise pixel coordinates ensures the 595x842 element matches the A4 PDF bounds 1:1
    jsPDF: { unit: "px", format: [595, 842], orientation: "portrait", hotfixes: ["px_scaling"] }
  };

  try {
    await html2pdf().set(options).from($("cover")).save();
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Direct PDF export failed. Using window print fallback.");
    window.print();
  } finally {
    button.disabled = false;
    button.innerHTML = originalHtml;
  }
});
