BEGIN;

-- Kredensial login Better Auth untuk data seed:
-- student@akara.sch.id / Password123!
-- salsa@akara.sch.id / Password123!
-- rani@akara.sch.id / Password123!

TRUNCATE TABLE
  failed_import_rows,
  exports,
  imports,
  quiz_user_answers,
  quiz_user,
  quiz_questions,
  quiz_attempts,
  quizzes,
  task_submission_rubric_scores,
  task_submissions,
  task_rubrics,
  tasks,
  lesson_user_durations,
  lesson_user,
  lessons,
  sections,
  module_student_class_schedules,
  modules_tingkat,
  modules_teacher,
  modules_student,
  modules_student_class,
  students,
  student_classes,
  teachers,
  modules,
  departments,
  tingkat,
  haris,
  rentang_jams,
  auth_sessions,
  auth_accounts,
  auth_verifications,
  users
RESTART IDENTITY CASCADE;

INSERT INTO departments (id, nama_jurusan, kepala_jurusan_id, gambar, created_at, updated_at, deleted_at) VALUES
  (1, 'Perhotelan', NULL, 'perhotelan.png', '2026-05-01 07:30:00', '2026-05-01 07:30:00', NULL);

INSERT INTO tingkat (id, name, created_at, updated_at) VALUES
  (1, 'XII', '2026-05-01 07:30:00', '2026-05-01 07:30:00');

INSERT INTO users (id, identifier, name, nisn, jurusan, photo, email, email_verified, password, created_at, updated_at) VALUES
  (1, 'student-fadlil', 'Muhammad Fadlil Habill', '9988776655', 'Perhotelan', 'fadlil.jpg', 'student@akara.sch.id', TRUE, '96f0e08e1cd0235a7bc21d3585d1af6e:f5e32d4b8089ecb4863fbffb763feac6902a7f6d061bb35b89e1f9b4af8ddc5762bd57a2dacd58a7f171e85c1cba6c56ae7542c22dd7952500ae24a157a5cbf7', '2026-05-01 07:35:00', '2026-05-01 07:35:00'),
  (2, 'student-salsa', 'Salsa Maharani', '9988776656', 'Perhotelan', 'salsa.jpg', 'salsa@akara.sch.id', TRUE, '96f0e08e1cd0235a7bc21d3585d1af6e:f5e32d4b8089ecb4863fbffb763feac6902a7f6d061bb35b89e1f9b4af8ddc5762bd57a2dacd58a7f171e85c1cba6c56ae7542c22dd7952500ae24a157a5cbf7', '2026-05-01 07:35:00', '2026-05-01 07:35:00'),
  (3, 'teacher-rani', 'Bu Rani Oktavia', NULL, 'Perhotelan', 'rani.jpg', 'rani@akara.sch.id', TRUE, '96f0e08e1cd0235a7bc21d3585d1af6e:f5e32d4b8089ecb4863fbffb763feac6902a7f6d061bb35b89e1f9b4af8ddc5762bd57a2dacd58a7f171e85c1cba6c56ae7542c22dd7952500ae24a157a5cbf7', '2026-05-01 07:35:00', '2026-05-01 07:35:00');

INSERT INTO teachers (id, user_id, nama, nip, status, jenis, foto, jurusan_id, created_at, updated_at, email, otp_code, otp_kedaluwarsa, email_terverifikasi_pada) VALUES
  (1, 3, 'Bu Rani Oktavia', 'T001', 'aktif', 'guru mapel', 'rani-guru.jpg', 1, '2026-05-01 07:40:00', '2026-05-01 07:40:00', 'rani@akara.sch.id', NULL, NULL, '2026-05-01 07:40:00');

INSERT INTO student_classes (id, jurusan_id, tingkat_id, nama_kelas, level, homeroom_teacher_id, created_at, updated_at) VALUES
  (1, 1, 1, 'Kelas 12 - A', 'A', 1, '2026-05-01 07:45:00', '2026-05-01 07:45:00');

INSERT INTO students (
  id, user_id, nama, nisn, kelas_id, jurusan_id, foto, created_at, updated_at, tingkat_id, email,
  kode_otp, otp_kedaluwarsa, email_terverifikasi_pada, nis, jenis_kelamin, tempat_lahir, tanggal_lahir,
  nama_orang_tua, agama, hp_orang_tua
) VALUES
  (1, 1, 'Muhammad Fadlil Habill', '9988776655', 1, 1, 'fadlil-siswa.jpg', '2026-05-01 07:50:00', '2026-05-01 07:50:00', 1, 'student@akara.sch.id', NULL, NULL, '2026-05-01 07:50:00', '220901', 'L', 'Bandung', '2007-09-10', 'Ahmad Habib', 'Islam', '081277889900'),
  (2, 2, 'Salsa Maharani', '9988776656', 1, 1, 'salsa-siswa.jpg', '2026-05-01 07:50:00', '2026-05-01 07:50:00', 1, 'salsa@akara.sch.id', NULL, NULL, '2026-05-01 07:50:00', '220902', 'P', 'Bandung', '2007-11-02', 'Nur Aeni', 'Islam', '081288991122');

INSERT INTO modules (id, judul, jurusan, deskripsi, thumbnail, jurusan_id, is_aktif, created_at, updated_at, tingkat_id) VALUES
  (1, 'Front Office Hospitality', 'Perhotelan', 'Pembelajaran operasional front office mulai dari first impression, reservation handling, sampai service recovery di akhir layanan tamu.', 'front-office.png', 1, TRUE, '2026-05-01 08:00:00', '2026-05-01 08:00:00', 1);

INSERT INTO modules_tingkat (id, module_id, tingkat_id, created_at, updated_at) VALUES
  (1, 1, 1, '2026-05-01 08:00:00', '2026-05-01 08:00:00');

INSERT INTO modules_teacher (id, module_id, teacher_id, created_at, updated_at) VALUES
  (1, 1, 1, '2026-05-01 08:05:00', '2026-05-01 08:05:00');

INSERT INTO modules_student_class (id, module_id, teacher_id, student_class_id, created_at, updated_at) VALUES
  (1, 1, 1, 1, '2026-05-01 08:10:00', '2026-05-01 08:10:00');

INSERT INTO modules_student (id, student_id, module_id, created_at, updated_at) VALUES
  (1, 1, 1, '2026-05-01 08:10:00', '2026-05-01 08:10:00'),
  (2, 2, 1, '2026-05-01 08:10:00', '2026-05-01 08:10:00');

INSERT INTO haris (id, nama_hari, urutan, created_at, updated_at) VALUES
  (1, 'Senin', 1, '2026-05-01 08:12:00', '2026-05-01 08:12:00'),
  (2, 'Rabu', 3, '2026-05-01 08:12:00', '2026-05-01 08:12:00');

INSERT INTO rentang_jams (id, jam_mulai, jam_selesai, created_at, updated_at) VALUES
  (1, TIME '08:00:00', TIME '09:30:00', '2026-05-01 08:12:00', '2026-05-01 08:12:00'),
  (2, TIME '10:00:00', TIME '11:30:00', '2026-05-01 08:12:00', '2026-05-01 08:12:00');

INSERT INTO module_student_class_schedules (id, module_student_class_id, hari_id, rentang_jam_id, created_at, updated_at) VALUES
  (1, 1, 1, 1, '2026-05-01 08:15:00', '2026-05-01 08:15:00'),
  (2, 1, 2, 2, '2026-05-01 08:15:00', '2026-05-01 08:15:00');

INSERT INTO sections (id, module_student_class_id, judul, urutan, created_at, updated_at) VALUES
  (1, 1, 'Bab 1 - Guest Arrival', 1, '2026-05-01 08:20:00', '2026-05-01 08:20:00'),
  (2, 1, 'Bab 2 - Reservation Handling', 2, '2026-05-01 08:20:00', '2026-05-01 08:20:00'),
  (3, 1, 'Bab 3 - Complaint and Recovery', 3, '2026-05-01 08:20:00', '2026-05-01 08:20:00');

INSERT INTO lessons (
  id, module_student_class_id, section_id, posisi, judul, konten, urutan, created_at, updated_at,
  tipe_konten, url_konten, durasi, tersedia_pada, status
) VALUES
  (1, 1, 1, 1, 'Pengantar Front Office', 'Bab ini membahas titik kontak pertama dengan tamu, standar komunikasi, bahasa tubuh profesional, dan urutan check-in dasar agar pelayanan terasa konsisten.', 1, '2026-05-01 08:30:00', '2026-05-12 08:15:00', 'video', 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE', 900, '2026-05-02', 'published'),
  (2, 1, 2, 4, 'Manajemen Reservasi Dasar', 'Siswa belajar membaca reservation note, memeriksa permintaan khusus, menyelaraskan tipe kamar, serta menghindari mismatch data yang memicu komplain.', 1, '2026-05-01 08:35:00', '2026-05-13 08:40:00', 'pdf', 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', 780, '2026-05-06', 'published'),
  (3, 1, 3, 7, 'Service Recovery Dasar', 'Service recovery menuntut empati, kecepatan respon, dan dokumentasi insiden. Dalam praktiknya, siswa perlu tahu kapan memberi solusi langsung dan kapan melakukan eskalasi.', 1, '2026-05-01 08:40:00', '2026-05-13 10:20:00', 'text', NULL, 840, '2026-05-10', 'published');

INSERT INTO lesson_user (id, user_id, lesson_id, is_completed, created_at, updated_at) VALUES
  (1, 1, 1, TRUE, '2026-05-07 09:00:00', '2026-05-07 09:18:00'),
  (2, 1, 2, TRUE, '2026-05-10 10:00:00', '2026-05-10 10:15:00'),
  (3, 1, 3, TRUE, '2026-05-13 09:40:00', '2026-05-13 10:20:00'),
  (4, 2, 1, TRUE, '2026-05-08 09:30:00', '2026-05-08 09:45:00'),
  (5, 2, 2, FALSE, '2026-05-12 10:05:00', '2026-05-12 10:12:00');

INSERT INTO lesson_user_durations (id, user_id, lesson_id, seconds, created_at, updated_at) VALUES
  (1, 1, 1, 900, '2026-05-07 09:00:00', '2026-05-07 09:18:00'),
  (2, 1, 2, 780, '2026-05-10 10:00:00', '2026-05-10 10:15:00'),
  (3, 1, 3, 840, '2026-05-13 09:40:00', '2026-05-13 10:20:00'),
  (4, 2, 1, 900, '2026-05-08 09:30:00', '2026-05-08 09:45:00'),
  (5, 2, 2, 240, '2026-05-12 10:05:00', '2026-05-12 10:12:00');

INSERT INTO quizzes (
  id, modules_student_class_id, section_id, lesson_id, judul, posisi, skor_lulus, durasi_menit,
  is_aktif, created_at, updated_at, available_at, deadline
) VALUES
  (1, 1, 1, 1, 'Quiz Layanan Tamu Awal', 2, 75, 20, TRUE, '2026-05-01 08:45:00', '2026-05-01 08:45:00', '2026-05-05 08:00:00', '2026-05-16 21:00:00'),
  (2, 1, 2, 2, 'Quiz Validasi Reservasi', 5, 80, 15, TRUE, '2026-05-01 08:50:00', '2026-05-01 08:50:00', '2026-05-09 08:00:00', '2026-05-18 21:00:00'),
  (3, 1, 3, 3, 'Quiz Service Recovery', 8, 80, 15, TRUE, '2026-05-01 08:55:00', '2026-05-01 08:55:00', '2026-05-13 08:00:00', '2026-05-20 21:00:00');

INSERT INTO quiz_questions (
  id, quiz_id, pertanyaan, question_image, opsi_a, opsi_b, opsi_c, opsi_d, opsi_benar, jawaban_benar, created_at, updated_at
) VALUES
  (1, 1, 'Apa tujuan utama greeting di front office?', NULL, 'Membangun first impression yang profesional', 'Mempercepat proses tanpa verifikasi', 'Menghindari interaksi terlalu lama', 'Menawarkan semua layanan premium di awal', 'A', 'Membangun first impression yang profesional', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
  (2, 1, 'Data apa yang wajib dipastikan saat check-in?', NULL, 'Daftar menu restoran', 'Identitas dan data reservasi tamu', 'Laporan housekeeping mingguan', 'Riwayat keluhan tamu lain', 'B', 'Identitas dan data reservasi tamu', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
  (3, 1, 'Respon awal terbaik saat tamu bertanya tentang fasilitas hotel adalah?', NULL, 'Mengarahkan tanpa penjelasan', 'Memberi jawaban singkat lalu pergi', 'Menjelaskan singkat dan memastikan kebutuhan tamu', 'Menyuruh tamu bertanya ke bagian lain', 'C', 'Menjelaskan singkat dan memastikan kebutuhan tamu', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
  (4, 2, 'Apa yang harus diperiksa sebelum menawarkan upgrade kamar?', NULL, 'Mood petugas', 'Kesesuaian reservasi dan kebutuhan tamu', 'Promo restoran harian', 'Komentar tamu sebelumnya', 'B', 'Kesesuaian reservasi dan kebutuhan tamu', '2026-05-01 09:05:00', '2026-05-01 09:05:00'),
  (5, 2, 'Jika data reservasi tidak sinkron, langkah pertama adalah?', NULL, 'Meminta tamu mencari sendiri bukti reservasi', 'Melanjutkan check-in agar cepat selesai', 'Verifikasi ulang data dan konfirmasi ke sistem', 'Mengganti tipe kamar tanpa persetujuan', 'C', 'Verifikasi ulang data dan konfirmasi ke sistem', '2026-05-01 09:05:00', '2026-05-01 09:05:00'),
  (6, 2, 'Special request tamu paling tepat dicatat di mana?', NULL, 'Di catatan pribadi petugas', 'Di reservation note/sistem operasional', 'Di grup chat siswa', 'Di menu promosi', 'B', 'Di reservation note/sistem operasional', '2026-05-01 09:05:00', '2026-05-01 09:05:00'),
  (7, 3, 'Langkah pertama saat menerima komplain ringan adalah?', NULL, 'Menyanggah keluhan tamu', 'Mendengarkan aktif dan mengklarifikasi masalah', 'Langsung memberi voucher', 'Menyuruh tamu bicara ke manajer', 'B', 'Mendengarkan aktif dan mengklarifikasi masalah', '2026-05-01 09:10:00', '2026-05-01 09:10:00'),
  (8, 3, 'Kapan petugas perlu melakukan eskalasi ke supervisor?', NULL, 'Saat tamu hanya meminta arah toilet', 'Saat masalah di luar kewenangan atau menyangkut kompensasi besar', 'Saat antrean sedang sepi', 'Setelah tamu meninggalkan meja', 'B', 'Saat masalah di luar kewenangan atau menyangkut kompensasi besar', '2026-05-01 09:10:00', '2026-05-01 09:10:00'),
  (9, 3, 'Penutupan interaksi service recovery yang baik adalah?', NULL, 'Menyudahi percakapan tanpa konfirmasi', 'Memastikan solusi dipahami dan tindak lanjut jelas', 'Meminta tamu menunggu tanpa penjelasan', 'Mengarahkan tamu ke ulasan online', 'B', 'Memastikan solusi dipahami dan tindak lanjut jelas', '2026-05-01 09:10:00', '2026-05-01 09:10:00');

INSERT INTO quiz_attempts (
  id, quiz_id, question_order, user_id, score, is_passed, started_at, submitted_at, duration_seconds, status, retake_requested, created_at, updated_at
) VALUES
  (1, 1, '[1,2,3]', 1, 100, TRUE, '2026-05-07 09:25:00', '2026-05-07 09:38:00', 780, 'on_time', FALSE, '2026-05-07 09:25:00', '2026-05-07 09:38:00'),
  (2, 1, '[1,2,3]', 2, 58, FALSE, '2026-05-08 09:55:00', '2026-05-08 10:12:00', 1020, 'on_time', TRUE, '2026-05-08 09:55:00', '2026-05-08 10:12:00'),
  (3, 2, '[4,5,6]', 1, 83, TRUE, '2026-05-11 10:20:00', '2026-05-11 10:32:00', 720, 'on_time', FALSE, '2026-05-11 10:20:00', '2026-05-11 10:32:00'),
  (4, 3, '[7,8,9]', 1, 0, FALSE, '2026-05-13 10:30:00', NULL, 0, 'on_time', FALSE, '2026-05-13 10:30:00', '2026-05-13 10:30:00');

INSERT INTO quiz_user (id, user_id, quiz_id, score, is_passed, created_at, updated_at) VALUES
  (1, 1, 1, 100, TRUE, '2026-05-07 09:38:00', '2026-05-07 09:38:00'),
  (2, 2, 1, 58, FALSE, '2026-05-08 10:12:00', '2026-05-08 10:12:00'),
  (3, 1, 2, 83, TRUE, '2026-05-11 10:32:00', '2026-05-11 10:32:00');

INSERT INTO quiz_user_answers (
  id, quiz_attempt_id, quiz_question_id, user_id, selected_option, is_correct, created_at, updated_at
) VALUES
  (1, 1, 1, 1, 'A', TRUE, '2026-05-07 09:28:00', '2026-05-07 09:28:00'),
  (2, 1, 2, 1, 'B', TRUE, '2026-05-07 09:31:00', '2026-05-07 09:31:00'),
  (3, 1, 3, 1, 'C', TRUE, '2026-05-07 09:35:00', '2026-05-07 09:35:00'),
  (4, 2, 1, 2, 'A', TRUE, '2026-05-08 10:00:00', '2026-05-08 10:00:00'),
  (5, 2, 2, 2, 'C', FALSE, '2026-05-08 10:04:00', '2026-05-08 10:04:00'),
  (6, 2, 3, 2, 'B', FALSE, '2026-05-08 10:08:00', '2026-05-08 10:08:00'),
  (7, 3, 4, 1, 'B', TRUE, '2026-05-11 10:23:00', '2026-05-11 10:23:00'),
  (8, 3, 5, 1, 'C', TRUE, '2026-05-11 10:26:00', '2026-05-11 10:26:00'),
  (9, 3, 6, 1, 'A', FALSE, '2026-05-11 10:30:00', '2026-05-11 10:30:00');

INSERT INTO tasks (
  id, modules_student_class_id, lesson_id, judul, deskripsi, attachment_type, attachment_path,
  deadline, available_at, allow_revision, is_aktif, status, created_at, updated_at
) VALUES
  (3, 1, 1, 'Tugas Simulasi Greeting', 'Rekam simulasi greeting dan check-in awal selama 2-3 menit. Unggah video ke drive dan pastikan link dapat diakses guru.', 'link', 'tasks/greeting-brief.pdf', '2026-05-16 23:59:00', '2026-05-05', FALSE, TRUE, 'published', '2026-05-01 09:15:00', '2026-05-01 09:15:00'),
  (6, 1, 2, 'Tugas Form Reservasi', 'Buat template pengecekan reservasi berisi nama tamu, tipe kamar, special request, dan status pembayaran.', 'pdf', 'tasks/form-reservasi.pdf', '2026-05-18 23:59:00', '2026-05-09', TRUE, TRUE, 'published', '2026-05-01 09:20:00', '2026-05-01 09:20:00'),
  (9, 1, 3, 'Tugas Response Komplain', 'Tulis SOP singkat penanganan komplain ringan dan contoh kalimat service recovery yang sopan.', 'pdf', 'tasks/service-recovery.pdf', '2026-05-20 23:59:00', '2026-05-13', TRUE, TRUE, 'published', '2026-05-01 09:25:00', '2026-05-01 09:25:00');

INSERT INTO task_rubrics (id, task_id, name, max_score, urutan, created_at, updated_at) VALUES
  (1, 3, 'Greeting dan first impression', 40, 1, '2026-05-01 09:18:00', '2026-05-01 09:18:00'),
  (2, 3, 'Verifikasi reservasi dan penutupan', 60, 2, '2026-05-01 09:18:00', '2026-05-01 09:18:00'),
  (3, 6, 'Kelengkapan field reservasi', 50, 1, '2026-05-01 09:22:00', '2026-05-01 09:22:00'),
  (4, 6, 'Kejelasan format dan akurasi data', 50, 2, '2026-05-01 09:22:00', '2026-05-01 09:22:00'),
  (5, 9, 'Identifikasi masalah dan empati', 50, 1, '2026-05-01 09:27:00', '2026-05-01 09:27:00'),
  (6, 9, 'Solusi dan tindak lanjut', 50, 2, '2026-05-01 09:27:00', '2026-05-01 09:27:00');

INSERT INTO task_submissions (
  id, task_id, user_id, submission_link, submitted_at, status, score, teacher_feedback, teacher_note, created_at, updated_at
) VALUES
  (1, 3, 1, 'https://drive.example.com/fadlil-greeting', '2026-05-09 19:10:00', 'graded', 88, 'Opening sudah hangat dan alur check-in jelas. Pertahankan konsistensi kontak mata.', 'Sudah lebih percaya diri saat greeting.', '2026-05-09 19:10:00', '2026-05-10 08:30:00'),
  (2, 3, 2, 'https://drive.example.com/salsa-greeting', '2026-05-10 20:05:00', 'submitted', NULL, '', 'Menunggu review guru.', '2026-05-10 20:05:00', '2026-05-10 20:05:00'),
  (3, 6, 1, 'https://drive.example.com/fadlil-reservasi', '2026-05-12 18:30:00', 'revised', 72, 'Kolom payment dan special request sudah ada, tetapi contoh data perlu dibuat lebih konsisten.', 'Perbaiki konsistensi kode reservasi dan format tanggal.', '2026-05-12 18:30:00', '2026-05-13 07:45:00');

INSERT INTO task_submission_rubric_scores (id, submission_id, rubric_id, score, created_at, updated_at) VALUES
  (1, 1, 1, 35, '2026-05-10 08:30:00', '2026-05-10 08:30:00'),
  (2, 1, 2, 53, '2026-05-10 08:30:00', '2026-05-10 08:30:00'),
  (3, 3, 3, 36, '2026-05-13 07:45:00', '2026-05-13 07:45:00'),
  (4, 3, 4, 36, '2026-05-13 07:45:00', '2026-05-13 07:45:00');

INSERT INTO auth_accounts (
  id, user_id, account_id, provider_id, access_token, refresh_token, access_token_expires_at,
  refresh_token_expires_at, scope, id_token, password, created_at, updated_at
) VALUES
  ('acc-student-fadlil', 1, '1', 'credential', NULL, NULL, NULL, NULL, NULL, NULL, '96f0e08e1cd0235a7bc21d3585d1af6e:f5e32d4b8089ecb4863fbffb763feac6902a7f6d061bb35b89e1f9b4af8ddc5762bd57a2dacd58a7f171e85c1cba6c56ae7542c22dd7952500ae24a157a5cbf7', '2026-05-01 07:35:00', '2026-05-01 07:35:00'),
  ('acc-student-salsa', 2, '2', 'credential', NULL, NULL, NULL, NULL, NULL, NULL, '96f0e08e1cd0235a7bc21d3585d1af6e:f5e32d4b8089ecb4863fbffb763feac6902a7f6d061bb35b89e1f9b4af8ddc5762bd57a2dacd58a7f171e85c1cba6c56ae7542c22dd7952500ae24a157a5cbf7', '2026-05-01 07:35:00', '2026-05-01 07:35:00'),
  ('acc-teacher-rani', 3, '3', 'credential', NULL, NULL, NULL, NULL, NULL, NULL, '96f0e08e1cd0235a7bc21d3585d1af6e:f5e32d4b8089ecb4863fbffb763feac6902a7f6d061bb35b89e1f9b4af8ddc5762bd57a2dacd58a7f171e85c1cba6c56ae7542c22dd7952500ae24a157a5cbf7', '2026-05-01 07:35:00', '2026-05-01 07:35:00');

INSERT INTO auth_sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at, updated_at) VALUES
  ('sess-student-active', 1, 'token-student-active', '2026-06-01 08:00:00', '127.0.0.1', 'seed-script', '2026-05-13 08:00:00', '2026-05-13 08:00:00'),
  ('sess-rani-active', 3, 'token-rani-active', '2026-06-01 08:00:00', '127.0.0.1', 'seed-script', '2026-05-13 08:00:00', '2026-05-13 08:00:00');

INSERT INTO auth_verifications (id, identifier, value, expires_at, created_at, updated_at) VALUES
  ('verif-reset-student', 'reset-password:student@akara.sch.id', '1', '2026-06-01 08:00:00', '2026-05-13 08:00:00', '2026-05-13 08:00:00'),
  ('verif-reset-rani', 'reset-password:rani@akara.sch.id', '3', '2026-06-01 08:00:00', '2026-05-13 08:00:00', '2026-05-13 08:00:00');

SELECT setval(pg_get_serial_sequence('departments', 'id'), 1, true);
SELECT setval(pg_get_serial_sequence('haris', 'id'), 2, true);
SELECT setval(pg_get_serial_sequence('lessons', 'id'), 3, true);
SELECT setval(pg_get_serial_sequence('lesson_user', 'id'), 5, true);
SELECT setval(pg_get_serial_sequence('lesson_user_durations', 'id'), 5, true);
SELECT setval(pg_get_serial_sequence('modules', 'id'), 1, true);
SELECT setval(pg_get_serial_sequence('modules_student', 'id'), 2, true);
SELECT setval(pg_get_serial_sequence('modules_student_class', 'id'), 1, true);
SELECT setval(pg_get_serial_sequence('modules_teacher', 'id'), 1, true);
SELECT setval(pg_get_serial_sequence('modules_tingkat', 'id'), 1, true);
SELECT setval(pg_get_serial_sequence('module_student_class_schedules', 'id'), 2, true);
SELECT setval(pg_get_serial_sequence('quizzes', 'id'), 3, true);
SELECT setval(pg_get_serial_sequence('quiz_attempts', 'id'), 4, true);
SELECT setval(pg_get_serial_sequence('quiz_questions', 'id'), 9, true);
SELECT setval(pg_get_serial_sequence('quiz_user', 'id'), 3, true);
SELECT setval(pg_get_serial_sequence('quiz_user_answers', 'id'), 9, true);
SELECT setval(pg_get_serial_sequence('rentang_jams', 'id'), 2, true);
SELECT setval(pg_get_serial_sequence('sections', 'id'), 3, true);
SELECT setval(pg_get_serial_sequence('students', 'id'), 2, true);
SELECT setval(pg_get_serial_sequence('student_classes', 'id'), 1, true);
SELECT setval(pg_get_serial_sequence('tasks', 'id'), 9, true);
SELECT setval(pg_get_serial_sequence('task_rubrics', 'id'), 6, true);
SELECT setval(pg_get_serial_sequence('task_submissions', 'id'), 3, true);
SELECT setval(pg_get_serial_sequence('task_submission_rubric_scores', 'id'), 4, true);
SELECT setval(pg_get_serial_sequence('teachers', 'id'), 1, true);
SELECT setval(pg_get_serial_sequence('tingkat', 'id'), 1, true);
SELECT setval(pg_get_serial_sequence('users', 'id'), 3, true);

COMMIT;
