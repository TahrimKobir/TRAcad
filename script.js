const $ = (id) => document.getElementById(id);

const defaults = {
  institution: "Sylhet Agricultural University",
  department: "Department of Agriculture",
  documentType: "Assignment",
  courseName: "Extension Communication & Group Approaches",
  courseCode: "AGEXT 211",
  title: "Effect of Salinity on Plant Growth",
  studentName: "Md. Tahrim Kobir Riyad",
  studentId: "1234567",
  reg: "1234",
  level: "00",
  semester: "00",
  session: "2023–24",
  teacherName: "Dr. Example Name",
  teacherDesignation: "Professor, Department of Agriculture",
  submissionDate: new Date().toISOString().slice(0,10),
  template: "sau"
};

const fields = Object.keys(defaults);

function getValue(id) {
  return $(id).value.trim();
}

function formatDate(value) {
  if (!value) return "Date";
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric"
  });
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

  $("previewInstitution").textContent = safeText(institution, "YOUR UNIVERSITY / INSTITUTION");
  $("previewDepartment").textContent = safeText(department, "Department Name");
  $("previewType").textContent = getValue("documentType") || "Assignment";
  $("previewTitle").textContent = safeText(getValue("title"), "Assignment Title");
  $("previewCourseName").textContent = safeText(getValue("courseName"), "Course Name");
  $("previewCourseCode").textContent = safeText(getValue("courseCode"), "Course Code");
  $("previewStudent").textContent = safeText(student, "Student Name");
  $("previewId").textContent = getValue("studentId") || "1234567";
  $("previewReg").textContent = getValue("reg") || "1234";
  $("previewLevel").textContent = level || "00";
  $("previewSemester").textContent = semester || "00";
  $("previewSession").textContent = session || "2022–23";
  $("previewTeacher").textContent = safeText(teacher, "Course teacher name");
  $("previewDesignation").textContent = safeText(designation, "Designation");
  $("previewDepartment2").textContent = safeText(department, "Department Name");
  $("previewFooterInstitution").textContent = safeText(institution, "Sylhet Agricultural University");
  $("previewFooterBrand").textContent = `${safeText(institution, "SYLHET AGRICULTURAL UNIVERSITY")}, SYLHET`.toUpperCase();

  $("cover").className = `cover ${getValue("template") || "sau"}`;
  if (getValue("template") === "sau" && localStorage.getItem("assignmentCoverLogo")) {
    $("watermarkLogo").src = localStorage.getItem("assignmentCoverLogo");
    $("watermarkLogo").classList.remove("hidden");
  } else {
    $("watermarkLogo").classList.add("hidden");
  }
}

function loadDefaults() {
  fields.forEach(id => {
    if ($(id)) $(id).value = defaults[id];
  });
  updatePreview();
}

function saveLocal() {
  const data = {};
  fields.forEach(id => data[id] = getValue(id));
  localStorage.setItem("assignmentCoverData", JSON.stringify(data));
}

function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem("assignmentCoverData"));
    if (!data) return false;
    fields.forEach(id => {
      if ($(id) && data[id] !== undefined) $(id).value = data[id];
    });
    return true;
  } catch {
    return false;
  }
}

$("coverForm").addEventListener("input", () => {
  updatePreview();
  saveLocal();
});

$("coverForm").addEventListener("change", () => {
  updatePreview();
  saveLocal();
});

$("logoInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = e => {
    $("previewLogo").src = e.target.result;
    $("previewLogo").classList.remove("hidden");
    $("watermarkLogo").src = e.target.result;
    $("watermarkLogo").classList.remove("hidden");
    $("logoLabel").textContent = file.name;
    localStorage.setItem("assignmentCoverLogo", e.target.result);
    updatePreview();
  };
  reader.readAsDataURL(file);
});

function restoreLogo() {
  const logo = localStorage.getItem("assignmentCoverLogo");
  if (logo) {
    $("previewLogo").src = logo;
    $("previewLogo").classList.remove("hidden");
    $("watermarkLogo").src = logo;
    $("watermarkLogo").classList.remove("hidden");
    $("logoLabel").textContent = "Saved logo";
  }
}

$("resetBtn").addEventListener("click", () => {
  if (!confirm("Reset all information to the default sample?")) return;
  localStorage.removeItem("assignmentCoverData");
  localStorage.removeItem("assignmentCoverLogo");
  $("logoInput").value = "";
  $("previewLogo").src = "";
  $("previewLogo").classList.add("hidden");
  $("logoLabel").textContent = "Upload logo (PNG/JPG)";
  loadDefaults();
});

$("printBtn").addEventListener("click", () => {
  window.print();
});

$("downloadBtn").addEventListener("click", async () => {
  const button = $("downloadBtn");
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = "Preparing PDF…";

  const title = (getValue("title") || "assignment-cover")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  const options = {
    margin: 0,
    filename: `${title || "assignment-cover"}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2.5, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all"] }
  };

  try {
    await html2pdf().set(options).from($("cover")).save();
  } catch (error) {
    console.error(error);
    alert("PDF generation failed. Please try the Print button and choose “Save as PDF”.");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});

if (!loadLocal()) loadDefaults();
else updatePreview();
restoreLogo();
