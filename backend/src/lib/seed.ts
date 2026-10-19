import { PrismaClient, SubmissionStatus, QuizAttemptsStatus, JenisKelaminEnum } from "@prisma/client";
import { auth } from "../config/auth.js";
import { prisma } from "./prisma.js";

async function main() {
  console.log("Cleaning up database...");
  
  // Delete in order to avoid FK violations
  await prisma.quizUserAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizUser.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.taskSubmissionRubricScore.deleteMany();
  await prisma.taskSubmission.deleteMany();
  await prisma.taskRubric.deleteMany();
  await prisma.lessonUserDuration.deleteMany();
  await prisma.lessonUser.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.task.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.section.deleteMany();
  await prisma.moduleStudentClassSchedule.deleteMany();
  await prisma.moduleStudentClass.deleteMany();
  await prisma.moduleTeacher.deleteMany();
  await prisma.moduleStudent.deleteMany();
  await prisma.moduleTingkat.deleteMany();
  await prisma.module.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.studentClass.deleteMany();
  await prisma.tingkat.deleteMany();
  await prisma.department.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hari.deleteMany();
  await prisma.rentangJam.deleteMany();

  console.log("Seeding base data (Departments, Tingkat, Haris)...");

  const deptHospitality = await prisma.department.create({
    data: { namaJurusan: "Perhotelan" }
  });
  const deptCulinary = await prisma.department.create({
    data: { namaJurusan: "Kuliner" }
  });
  const deptDesign = await prisma.department.create({
    data: { namaJurusan: "DKV" }
  });

  const tingkat12 = await prisma.tingkat.create({
    data: { name: "12" }
  });

  const class12A = await prisma.studentClass.create({
    data: {
      namaKelas: "Kelas 12 - A",
      tingkatId: tingkat12.id,
      jurusanId: deptHospitality.id,
      level: "A"
    }
  });

  const haris = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  for (let i = 0; i < haris.length; i++) {
    const namaHari = haris[i]!;
    await prisma.hari.create({
      data: { namaHari, urutan: i + 1 }
    });
  }

  console.log("Seeding users via BetterAuth...");

  // Create Student User
  const studentResult = await auth.api.signUpEmail({
    body: {
      email: "student@akara.sch.id",
      password: "password123",
      name: "Muhammad Fadlil Habill",
    }
  });

  if (!studentResult || !studentResult.user) {
    throw new Error("Failed to create student user");
  }

  const studentUser = studentResult.user;

  await prisma.student.create({
    data: {
      userId: BigInt(studentUser.id),
      nama: studentUser.name,
      email: studentUser.email!,
      nisn: "9988776655",
      kelasId: class12A.id,
      jurusanId: deptHospitality.id,
      tingkatId: tingkat12.id,
      jenisKelamin: JenisKelaminEnum.L
    }
  });

  // Create Teacher Users
  const raniResult = await auth.api.signUpEmail({
    body: {
      email: "rani@akara.sch.id",
      password: "password123",
      name: "Bu Rani Oktavia",
    }
  });

  const teacherRani = raniResult.user!;

  const teacherRaniRecord = await prisma.teacher.create({
    data: {
      userId: BigInt(teacherRani.id),
      nama: teacherRani.name,
      email: teacherRani.email!,
      nip: "T001",
      jurusanId: deptHospitality.id
    }
  });

  const aryaResult = await auth.api.signUpEmail({
    body: {
      email: "arya@akara.sch.id",
      password: "password123",
      name: "Pak Arya Suranta",
    }
  });

  const teacherArya = aryaResult.user!;

  const teacherAryaRecord = await prisma.teacher.create({
    data: {
      userId: BigInt(teacherArya.id),
      nama: teacherArya.name,
      email: teacherArya.email!,
      nip: "T002",
      jurusanId: deptCulinary.id
    }
  });

  console.log("Seeding modules and contents...");

  // Module 1: Front Office
  const moduleFO = await prisma.module.create({
    data: {
      judul: "Front Office Hospitality",
      deskripsi: "Pembelajaran operasional front office mulai dari first impression, reservation handling, sampai service recovery.",
      jurusanId: deptHospitality.id,
      jurusan: "Perhotelan",
      tingkatId: tingkat12.id
    }
  });

  const offeringFO = await prisma.moduleStudentClass.create({
    data: {
      moduleId: moduleFO.id,
      studentClassId: class12A.id,
      teacherId: teacherRaniRecord.id
    }
  });

  const sectionFO1 = await prisma.section.create({
    data: {
      judul: "Bab 1 - Guest Arrival",
      moduleStudentClassId: offeringFO.id,
      urutan: 1
    }
  });

  const lessonFO1 = await prisma.lesson.create({
    data: {
      judul: "Pengantar Front Office",
      konten: "Bab ini membahas titik kontak pertama dengan tamu, standar komunikasi, bahasa tubuh profesional, dan urutan check-in dasar.",
      tipeKonten: "video",
      urlKonten: "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
      posisi: 1,
      moduleStudentClassId: offeringFO.id,
      sectionId: sectionFO1.id,
      durasi: 900
    }
  });

  const quizFO1 = await prisma.quiz.create({
    data: {
      judul: "Quiz Layanan Tamu Awal",
      modulesStudentClassId: offeringFO.id,
      sectionId: sectionFO1.id,
      posisi: 2,
      skorLulus: 75,
      durasiMenit: 20,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.quizQuestion.createMany({
    data: [
      {
        quizId: quizFO1.id,
        pertanyaan: "Apa tujuan utama greeting di front office?",
        opsiA: "Membangun first impression yang profesional",
        opsiB: "Mempercepat proses tanpa verifikasi",
        opsiC: "Menghindari interaksi terlalu lama",
        opsiD: "Menawarkan semua layanan premium di awal",
        opsiBenar: "A"
      },
      {
        quizId: quizFO1.id,
        pertanyaan: "Data apa yang wajib dipastikan saat check-in?",
        opsiA: "Daftar menu restoran",
        opsiB: "Identitas dan data reservasi tamu",
        opsiC: "Laporan housekeeping mingguan",
        opsiD: "Riwayat keluhan tamu lain",
        opsiBenar: "B"
      }
    ]
  });

  await prisma.task.create({
    data: {
      judul: "Tugas Simulasi Greeting",
      deskripsi: "Rekam simulasi greeting dan check-in awal selama 2-3 menit. Unggah video ke drive dan pastikan link dapat diakses guru.",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      allowRevision: false,
      modulesStudentClassId: offeringFO.id,
      sectionId: sectionFO1.id,
      lessonId: lessonFO1.id
    }
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
