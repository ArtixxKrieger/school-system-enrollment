import { db, usersTable, rolesTable, rolePermissionsTable, coursesTable, enrollmentSettingsTable, studentsTable, enrolleesTable, curriculumTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding database...");

  // Roles
  const roles = await db
    .insert(rolesTable)
    .values([
      { name: "superadmin", description: "Full system access", isSystem: true },
      { name: "admin", description: "Administrative access", isSystem: true },
      { name: "staff", description: "Staff access for enrollment processing", isSystem: true },
      { name: "professor", description: "Professor access for academic records", isSystem: true },
      { name: "student", description: "Student portal access", isSystem: true },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`Inserted ${roles.length} roles`);

  // Users
  const [superadminRole] = await db.query.rolesTable.findMany().then((r) => r.filter((x) => x.name === "superadmin"));
  const [adminRole] = await db.query.rolesTable.findMany().then((r) => r.filter((x) => x.name === "admin"));
  const [staffRole] = await db.query.rolesTable.findMany().then((r) => r.filter((x) => x.name === "staff"));
  const [professorRole] = await db.query.rolesTable.findMany().then((r) => r.filter((x) => x.name === "professor"));
  const [studentRole] = await db.query.rolesTable.findMany().then((r) => r.filter((x) => x.name === "student"));

  const users = await db
    .insert(usersTable)
    .values([
      { username: "superadmin", password: await bcrypt.hash("superadmin123", 10), email: "superadmin@kurios.edu.ph", fullName: "Super Administrator", role: "superadmin", roleId: superadminRole?.id },
      { username: "admin", password: await bcrypt.hash("admin123", 10), email: "admin@kurios.edu.ph", fullName: "System Administrator", role: "admin", roleId: adminRole?.id },
      { username: "staff1", password: await bcrypt.hash("staff123", 10), email: "staff1@kurios.edu.ph", fullName: "Maria Santos", role: "staff", roleId: staffRole?.id },
      { username: "professor1", password: await bcrypt.hash("professor123", 10), email: "professor1@kurios.edu.ph", fullName: "Dr. Jose Reyes", role: "professor", roleId: professorRole?.id },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`Inserted ${users.length} users`);

  // Courses
  const courses = await db
    .insert(coursesTable)
    .values([
      { courseCode: "BSIT", courseName: "Bachelor of Science in Information Technology", description: "4-year program in IT", displayOrder: 1 },
      { courseCode: "BSCS", courseName: "Bachelor of Science in Computer Science", description: "4-year program in CS", displayOrder: 2 },
      { courseCode: "BSBA", courseName: "Bachelor of Science in Business Administration", description: "4-year business program", displayOrder: 3 },
      { courseCode: "BSED", courseName: "Bachelor of Science in Education", description: "4-year education program", displayOrder: 4 },
      { courseCode: "BSCRIM", courseName: "Bachelor of Science in Criminology", description: "4-year criminology program", displayOrder: 5 },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`Inserted ${courses.length} courses`);

  // Settings
  await db.insert(enrollmentSettingsTable).values({ autoCloseAccounts: "never", strictEnrollmentWindows: false, autoProgression: true }).onConflictDoNothing();

  // Curriculum for BSIT Year 1
  const bsit = courses.find((c) => c.courseCode === "BSIT") ?? (await db.query.coursesTable.findFirst());
  if (bsit) {
    const subjects = [
      { courseId: bsit.id, subjectCode: "IT101", subjectName: "Introduction to Computing", yearLevel: 1, semester: 1, units: 3 },
      { courseId: bsit.id, subjectCode: "IT102", subjectName: "Computer Programming 1", yearLevel: 1, semester: 1, units: 3 },
      { courseId: bsit.id, subjectCode: "IT103", subjectName: "Mathematics in the Modern World", yearLevel: 1, semester: 1, units: 3 },
      { courseId: bsit.id, subjectCode: "IT104", subjectName: "Purposive Communication", yearLevel: 1, semester: 1, units: 3 },
      { courseId: bsit.id, subjectCode: "IT105", subjectName: "Understanding the Self", yearLevel: 1, semester: 1, units: 3 },
      { courseId: bsit.id, subjectCode: "IT201", subjectName: "Computer Programming 2", yearLevel: 1, semester: 2, units: 3, prerequisites: "IT102" },
      { courseId: bsit.id, subjectCode: "IT202", subjectName: "Data Structures and Algorithms", yearLevel: 1, semester: 2, units: 3, prerequisites: "IT102" },
      { courseId: bsit.id, subjectCode: "IT203", subjectName: "Database Management Systems", yearLevel: 1, semester: 2, units: 3 },
      { courseId: bsit.id, subjectCode: "IT204", subjectName: "Web Technologies 1", yearLevel: 1, semester: 2, units: 3 },
      { courseId: bsit.id, subjectCode: "IT301", subjectName: "Object Oriented Programming", yearLevel: 2, semester: 1, units: 3, prerequisites: "IT201" },
      { courseId: bsit.id, subjectCode: "IT302", subjectName: "Systems Analysis and Design", yearLevel: 2, semester: 1, units: 3 },
      { courseId: bsit.id, subjectCode: "IT303", subjectName: "Web Technologies 2", yearLevel: 2, semester: 1, units: 3, prerequisites: "IT204" },
      { courseId: bsit.id, subjectCode: "IT401", subjectName: "Software Engineering", yearLevel: 2, semester: 2, units: 3 },
      { courseId: bsit.id, subjectCode: "IT402", subjectName: "Mobile Application Development", yearLevel: 2, semester: 2, units: 3 },
    ];
    const curriculum = await db.insert(curriculumTable).values(subjects).onConflictDoNothing().returning();
    console.log(`Inserted ${curriculum.length} curriculum subjects`);
  }

  // Sample students
  const bsitCourse = courses.find((c) => c.courseCode === "BSIT") ?? courses[0];
  const bscsCourse = courses.find((c) => c.courseCode === "BSCS") ?? courses[1];

  if (bsitCourse && bscsCourse) {
    const sampleStudents = [
      { studentId: "2024-10001", firstName: "Juan", lastName: "dela Cruz", middleName: "Santos", email: "juan.delacruz@kurios.edu.ph", courseId: bsitCourse.id, yearLevel: 1, gender: "male", financeStatus: "fully_paid", studentType: "regular", status: "active", flagGroup: "faithfulness" },
      { studentId: "2024-10002", firstName: "Maria", lastName: "Reyes", middleName: "Bautista", email: "maria.reyes@kurios.edu.ph", courseId: bsitCourse.id, yearLevel: 1, gender: "female", financeStatus: "down_payment", studentType: "regular", status: "active", flagGroup: "kindness" },
      { studentId: "2024-10003", firstName: "Pedro", lastName: "Garcia", email: "pedro.garcia@kurios.edu.ph", courseId: bscsCourse.id, yearLevel: 2, gender: "male", financeStatus: "fully_paid", studentType: "regular", status: "active", flagGroup: "peace" },
      { studentId: "2023-10001", firstName: "Ana", lastName: "Lopez", email: "ana.lopez@kurios.edu.ph", courseId: bsitCourse.id, yearLevel: 2, gender: "female", financeStatus: "promisory", studentType: "irregular", status: "active", flagGroup: "love" },
      { studentId: "2023-10002", firstName: "Carlos", lastName: "Mendoza", email: "carlos.mendoza@kurios.edu.ph", courseId: bscsCourse.id, yearLevel: 3, gender: "male", financeStatus: "fully_paid", studentType: "regular", status: "active", flagGroup: "self_control" },
    ];
    const students = await db.insert(studentsTable).values(sampleStudents).onConflictDoNothing().returning();
    console.log(`Inserted ${students.length} sample students`);
  }

  // Sample enrollees
  const bsitForEnrollees = courses.find((c) => c.courseCode === "BSIT") ?? courses[0];
  if (bsitForEnrollees) {
    const sampleEnrollees = [
      { preRegNumber: "PRE-2025-11001", firstName: "Roberto", lastName: "Cruz", email: "roberto.cruz@gmail.com", phone: "09171234567", courseId: bsitForEnrollees.id, yearLevel: 1, status: "pre-registered", enrollmentType: "new", gender: "male" },
      { preRegNumber: "PRE-2025-11002", firstName: "Liza", lastName: "Flores", email: "liza.flores@gmail.com", phone: "09189876543", courseId: bsitForEnrollees.id, yearLevel: 1, status: "pre-registered", enrollmentType: "new", gender: "female" },
      { preRegNumber: "PRE-2025-11003", firstName: "Mark", lastName: "Villanueva", email: "mark.villanueva@gmail.com", courseId: bsitForEnrollees.id, yearLevel: 2, status: "approved", enrollmentType: "returning", gender: "male" },
    ];
    const enrollees = await db.insert(enrolleesTable).values(sampleEnrollees).onConflictDoNothing().returning();
    console.log(`Inserted ${enrollees.length} sample enrollees`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
