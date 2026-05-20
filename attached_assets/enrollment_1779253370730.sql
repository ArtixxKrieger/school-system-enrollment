-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 20, 2026 at 06:17 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `enrollment`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `description`, `entity_type`, `entity_id`, `old_value`, `new_value`, `ip_address`, `created_at`) VALUES
(1, 1, 'enrollment_settings_updated', 'Updated advanced enrollment settings.', 'enrollment_settings', 1, '{\"id\":1,\"auto_close_accounts\":\"never\",\"strict_enrollment_windows\":0,\"auto_progression\":1,\"system_close_date\":null,\"created_at\":\"2026-04-23 11:31:20\",\"updated_at\":\"2026-04-23 11:31:20\"}', '{\"auto_close_accounts\":\"never\",\"strict_enrollment_windows\":false,\"auto_progression\":false,\"system_close_date\":null}', '::1', '2026-04-23 04:09:17'),
(2, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSIT - Bachelor of Science in Information Technology.', 'course_enrollment_schedule', NULL, NULL, '{\"course_id\":1,\"course_code\":\"BSIT\",\"course_name\":\"Bachelor of Science in Information Technology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:10:03'),
(3, 1, 'approved_student', 'Approved enrollee PRE-20260001 as student 2026-0001', 'student', 348, NULL, NULL, NULL, '2026-04-23 04:32:22'),
(4, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (309 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":309,\"message\":\"309 student(s) sent to the Registered re-enrollment queue with pending status for the next year level. Accounts remain active.\"}', '::1', '2026-04-23 04:49:10'),
(5, 1, 'enrollment_settings_updated', 'Updated advanced enrollment settings.', 'enrollment_settings', 1, '{\"id\":1,\"auto_close_accounts\":\"never\",\"strict_enrollment_windows\":0,\"auto_progression\":0,\"system_close_date\":null,\"created_at\":\"2026-04-23 11:31:20\",\"updated_at\":\"2026-04-23 12:09:17\"}', '{\"auto_close_accounts\":\"never\",\"strict_enrollment_windows\":false,\"auto_progression\":false,\"system_close_date\":null}', '::1', '2026-04-23 04:53:33'),
(6, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSIT - Bachelor of Science in Information Technology.', 'course_enrollment_schedule', 1, '{\"id\":1,\"course_id\":1,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":1,\"course_code\":\"BSIT\",\"course_name\":\"Bachelor of Science in Information Technology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:53:34'),
(7, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSCRIM - Bachelor of Science in Criminology.', 'course_enrollment_schedule', NULL, NULL, '{\"course_id\":2,\"course_code\":\"BSCRIM\",\"course_name\":\"Bachelor of Science in Criminology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:53:35'),
(8, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSIT - Bachelor of Science in Information Technology.', 'course_enrollment_schedule', 1, '{\"id\":1,\"course_id\":1,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":1,\"course_code\":\"BSIT\",\"course_name\":\"Bachelor of Science in Information Technology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:12'),
(9, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSCRIM - Bachelor of Science in Criminology.', 'course_enrollment_schedule', 2, '{\"id\":2,\"course_id\":2,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":2,\"course_code\":\"BSCRIM\",\"course_name\":\"Bachelor of Science in Criminology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:12'),
(10, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSED - Bachelor of Secondary Education.', 'course_enrollment_schedule', NULL, NULL, '{\"course_id\":3,\"course_code\":\"BSED\",\"course_name\":\"Bachelor of Secondary Education\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:13'),
(11, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSBA - Bachelor of Science in Business Administration.', 'course_enrollment_schedule', NULL, NULL, '{\"course_id\":4,\"course_code\":\"BSBA\",\"course_name\":\"Bachelor of Science in Business Administration\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:13'),
(12, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSIT - Bachelor of Science in Information Technology.', 'course_enrollment_schedule', 1, '{\"id\":1,\"course_id\":1,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":1,\"course_code\":\"BSIT\",\"course_name\":\"Bachelor of Science in Information Technology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:22'),
(13, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSCRIM - Bachelor of Science in Criminology.', 'course_enrollment_schedule', 2, '{\"id\":2,\"course_id\":2,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":2,\"course_code\":\"BSCRIM\",\"course_name\":\"Bachelor of Science in Criminology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:22'),
(14, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSED - Bachelor of Secondary Education.', 'course_enrollment_schedule', 3, '{\"id\":3,\"course_id\":3,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":3,\"course_code\":\"BSED\",\"course_name\":\"Bachelor of Secondary Education\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:22'),
(15, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSBA - Bachelor of Science in Business Administration.', 'course_enrollment_schedule', 4, '{\"id\":4,\"course_id\":4,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":4,\"course_code\":\"BSBA\",\"course_name\":\"Bachelor of Science in Business Administration\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:23'),
(16, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for THEO - Theology.', 'course_enrollment_schedule', NULL, NULL, '{\"course_id\":5,\"course_code\":\"THEO\",\"course_name\":\"Theology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:56:23'),
(17, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSIT - Bachelor of Science in Information Technology.', 'course_enrollment_schedule', 1, '{\"id\":1,\"course_id\":1,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":1,\"course_code\":\"BSIT\",\"course_name\":\"Bachelor of Science in Information Technology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:57:40'),
(18, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSCRIM - Bachelor of Science in Criminology.', 'course_enrollment_schedule', 2, '{\"id\":2,\"course_id\":2,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":2,\"course_code\":\"BSCRIM\",\"course_name\":\"Bachelor of Science in Criminology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:57:40'),
(19, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSED - Bachelor of Secondary Education.', 'course_enrollment_schedule', 3, '{\"id\":3,\"course_id\":3,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":3,\"course_code\":\"BSED\",\"course_name\":\"Bachelor of Secondary Education\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:57:41'),
(20, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for BSBA - Bachelor of Science in Business Administration.', 'course_enrollment_schedule', 4, '{\"id\":4,\"course_id\":4,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":4,\"course_code\":\"BSBA\",\"course_name\":\"Bachelor of Science in Business Administration\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:57:41'),
(21, 1, 'course_enrollment_schedule_saved', 'Saved enrollment window for THEO - Theology.', 'course_enrollment_schedule', 5, '{\"id\":5,\"course_id\":5,\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '{\"course_id\":5,\"course_code\":\"THEO\",\"course_name\":\"Theology\",\"enrollment_start_date\":\"2026-04-10 07:00:00\",\"enrollment_end_date\":\"2026-05-10 19:00:00\",\"max_slots\":null}', '::1', '2026-04-23 04:57:41'),
(22, 1, 're_enrolled_student', 'Re-enrolled student 2025-0080 for 2026-2027 semester 1, year level 2', 'student', 291, NULL, NULL, NULL, '2026-04-23 05:02:38'),
(23, 1, 're_enrolled_student', 'Re-enrolled student 2025-0081 for 2026-2027 semester 1, year level 2', 'student', 292, NULL, NULL, NULL, '2026-04-23 05:06:27'),
(24, 1, 'approved_student', 'Approved enrollee PRE-20260001 as student 2026-0001', 'student', 479, NULL, NULL, NULL, '2026-04-23 05:16:43'),
(25, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (130 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":130,\"message\":\"130 student(s) sent to the Registered re-enrollment queue with pending status for 2nd semester. Accounts remain active.\"}', '::1', '2026-04-23 05:18:36'),
(26, 1, 're_enrolled_student', 'Re-enrolled student 2025-0002 for 2025-2026 semester 2, year level 1', 'student', 350, NULL, NULL, NULL, '2026-04-23 05:33:06'),
(27, 1, 're_enrolled_student', 'Re-enrolled student 2025-0001 for 2025-2026 semester 2, year level 1', 'student', 349, NULL, NULL, NULL, '2026-04-23 05:33:08'),
(28, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (2 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":2,\"message\":\"2 student(s) sent to the Registered re-enrollment queue with pending status for the next year level. Accounts remain active.\"}', '::1', '2026-04-23 05:33:33'),
(29, 1, 'approved_student', 'Approved enrollee PRE-20260001 as student 2026-0001', 'student', 517, NULL, NULL, NULL, '2026-04-23 06:09:05'),
(30, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (37 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":37,\"message\":\"37 student(s) sent to the Registered re-enrollment queue with pending status for the next year level. Accounts remain active.\"}', '::1', '2026-04-23 06:10:35'),
(31, 1, 're_enrolled_student', 'Re-enrolled student 2025-0002 for 2026-2027 semester 1, year level 2', 'student', 481, NULL, NULL, NULL, '2026-04-23 06:17:47'),
(32, 1, 're_enrolled_student', 'Re-enrolled student 2025-0001 for 2026-2027 semester 1, year level 2', 'student', 480, NULL, NULL, NULL, '2026-04-23 06:20:27'),
(33, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (37 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":37,\"message\":\"37 student(s) sent to the Registered re-enrollment queue with pending status for 2nd semester. Accounts remain active.\"}', '::1', '2026-04-23 06:33:56'),
(34, 1, 're_enrolled_student', 'Re-enrolled student 2025-0001 for 2025-2026 semester 2, year level 1', 'student', 518, NULL, NULL, NULL, '2026-04-23 06:44:39'),
(35, 1, 're_enrolled_student', 'Re-enrolled student 2025-0003 for 2025-2026 semester 2, year level 1', 'student', 520, NULL, NULL, NULL, '2026-04-23 07:09:48'),
(36, 1, 're_enrolled_student', 'Re-enrolled student 2025-0002 for 2025-2026 semester 2, year level 1', 'student', 519, NULL, NULL, NULL, '2026-04-23 07:25:21'),
(37, 1, 're_enrolled_student', 'Re-enrolled student 2025-0005 for 2025-2026 semester 2, year level 1', 'student', 522, NULL, NULL, NULL, '2026-04-23 07:25:25'),
(38, 1, 're_enrolled_student', 'Re-enrolled student 2025-0004 for 2025-2026 semester 2, year level 1', 'student', 521, NULL, NULL, NULL, '2026-04-23 07:25:28'),
(39, 1, 're_enrolled_student', 'Re-enrolled student 2025-0008 for 2025-2026 semester 2, year level 1', 'student', 525, NULL, NULL, NULL, '2026-04-23 07:27:43'),
(40, 1, 're_enrolled_student', 'Re-enrolled student 2025-0007 for 2025-2026 semester 2, year level 1', 'student', 524, NULL, NULL, NULL, '2026-04-23 07:27:46'),
(41, 1, 're_enrolled_student', 'Re-enrolled student 2025-0006 for 2025-2026 semester 2, year level 1', 'student', 523, NULL, NULL, NULL, '2026-04-23 07:27:48'),
(42, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (8 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":8,\"message\":\"8 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. Students can now see next year\'s 1st semester subjects.\"}', '::1', '2026-04-23 07:29:12'),
(43, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (0 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":0,\"message\":\"No eligible students found for 2nd semester progression.\"}', '::1', '2026-04-23 07:30:48'),
(44, 1, 're_enrolled_student', 'Re-enrolled student 2025-0001 for 2025-2026 semester 2, year level 2', 'student', 518, NULL, NULL, NULL, '2026-04-23 07:31:22'),
(45, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. Students can now see next year\'s 1st semester subjects.\"}', '::1', '2026-04-23 07:31:56'),
(46, 1, 're_enrolled_student', 'Re-enrolled student 2025-0001 for 2025-2026 semester 2, year level 3', 'student', 518, NULL, NULL, NULL, '2026-04-23 07:41:39'),
(47, 1, 're_enrolled_student', 'Re-enrolled student 2025-0002 for 2025-2026 semester 2, year level 2', 'student', 519, NULL, NULL, NULL, '2026-04-23 07:54:03'),
(48, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (2 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":2,\"message\":\"2 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. Students can now see next year\'s 1st semester subjects.\"}', '::1', '2026-04-23 07:54:34'),
(49, 1, 're_enrolled_student', 'Re-enrolled student 2025-0001 for 2025-2026 semester 2, year level 4', 'student', 518, NULL, NULL, NULL, '2026-04-23 07:55:51'),
(50, 1, 'approved_student', 'Approved enrollee PRE-20260001 as student 2026-0001', 'student', 555, NULL, NULL, NULL, '2026-04-23 08:00:39'),
(51, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. Students can now see next year\'s 1st semester subjects.\"}', '::1', '2026-04-23 08:01:17'),
(52, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 2, year level 2', 'student', 555, NULL, NULL, NULL, '2026-04-23 08:07:51'),
(53, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. Students can now see next year\'s 1st semester subjects.\"}', '::1', '2026-04-23 08:08:08'),
(54, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (0 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":0,\"message\":\"No eligible students found for 1st semester progression.\"}', '::1', '2026-04-23 08:08:19'),
(55, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 2, year level 3', 'student', 555, NULL, NULL, NULL, '2026-04-23 08:08:30'),
(56, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. Students can now see next year\'s 1st semester subjects.\"}', '::1', '2026-04-23 08:08:38'),
(57, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 2, year level 4', 'student', 555, NULL, NULL, NULL, '2026-04-23 08:38:08'),
(58, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (0 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":0,\"message\":\"No eligible students found for 1st semester progression.\"}', '::1', '2026-04-23 08:38:26'),
(59, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. Students can now see next year\'s 1st semester subjects.\"}', '::1', '2026-04-23 08:38:43'),
(60, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 2, year level 4', 'student', 555, NULL, NULL, NULL, '2026-04-23 08:39:33'),
(61, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected, 0 advanced, 1 graduated).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"advanced\":0,\"graduated\":1,\"message\":\"0 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. 1 terminal student(s) were marked as graduated and moved to Records.\"}', '::1', '2026-04-23 08:39:48'),
(62, 1, 'approved_student', 'Approved enrollee PRE-20260002 as student 2026-0002', 'student', 556, NULL, NULL, NULL, '2026-04-23 08:55:44'),
(63, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-23 08:57:40'),
(64, 1, 're_enrolled_student', 'Re-enrolled student 2026-0002 for 2026-2027 semester 1, year level 2', 'student', 556, NULL, NULL, NULL, '2026-04-23 08:58:19'),
(65, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-23 09:01:57'),
(66, 1, 're_enrolled_student', 'Re-enrolled student 2026-0002 for 2027-2028 semester 1, year level 3', 'student', 556, NULL, NULL, NULL, '2026-04-23 09:03:18'),
(67, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-23 09:04:33'),
(68, 1, 're_enrolled_student', 'Re-enrolled student 2026-0002 for 2028-2029 semester 1, year level 4', 'student', 556, NULL, NULL, NULL, '2026-04-23 09:04:57'),
(69, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-23 09:06:32'),
(70, 1, 're_enrolled_student', 'Re-enrolled student 2026-0002 for 2029-2030 semester 1, year level 4', 'student', 556, NULL, NULL, NULL, '2026-04-23 09:07:21'),
(71, 1, 'approved_student', 'Approved enrollee PRE-20260001 as student 2026-0001', 'student', 557, NULL, NULL, NULL, '2026-04-23 09:09:05'),
(72, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-23 09:09:43'),
(73, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2026-2027 semester 1, year level 2', 'student', 557, NULL, NULL, NULL, '2026-04-23 09:10:19'),
(74, 1, 'approved_student', 'Approved enrollee PRE-20260001 as student 2026-0001', 'student', 558, NULL, NULL, NULL, '2026-04-23 09:15:28'),
(75, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-23 09:15:56'),
(76, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 2, year level 1', 'student', 558, NULL, NULL, NULL, '2026-04-23 09:16:23'),
(77, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. \"}', '::1', '2026-04-23 09:16:45'),
(78, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 1, year level 2', 'student', 558, NULL, NULL, NULL, '2026-04-23 09:26:34'),
(79, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-23 09:26:44'),
(80, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 2, year level 2', 'student', 558, NULL, NULL, NULL, '2026-04-23 09:27:20'),
(81, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. \"}', '::1', '2026-04-23 09:27:41'),
(82, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 1, year level 3', 'student', 558, NULL, NULL, NULL, '2026-04-24 02:24:51'),
(83, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-24 02:25:28'),
(84, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 2, year level 3', 'student', 558, NULL, NULL, NULL, '2026-04-24 02:26:32'),
(85, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. \"}', '::1', '2026-04-24 02:26:40'),
(86, 1, 'approved_student', 'Approved enrollee PRE-20260001 as student 2026-0001', 'student', 559, NULL, NULL, NULL, '2026-04-24 02:38:23'),
(87, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 1 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":1,\"affected\":1,\"message\":\"1 student(s) advanced to 2nd semester and sent to re-enrollment queue. Students can now see 2nd semester subjects.\"}', '::1', '2026-04-24 02:38:57'),
(88, 1, 're_enrolled_student', 'Re-enrolled student 2026-0001 for 2025-2026 semester 2, year level 1', 'student', 559, NULL, NULL, NULL, '2026-04-24 02:39:42'),
(89, 1, 'semester_end_triggered', 'Processed semester-end progression for semester 2 (1 student(s) affected).', 'enrollment_progression', NULL, NULL, '{\"semester\":2,\"affected\":1,\"message\":\"1 student(s) advanced to next year level (1st semester) and sent to re-enrollment queue. \"}', '::1', '2026-04-24 02:39:53');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `course_code` varchar(10) NOT NULL,
  `course_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `course_code`, `course_name`, `description`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'BSIT', 'Bachelor of Science in Information Technology', 'Focus on software development, networking, and database management', 1, 1, '2026-04-23 03:31:20', '2026-04-23 03:31:20'),
(2, 'BSCRIM', 'Bachelor of Science in Criminology', 'Study of crime, criminal behavior, and law enforcement', 1, 2, '2026-04-23 03:31:20', '2026-04-23 03:31:20'),
(3, 'BSED', 'Bachelor of Secondary Education', 'Preparation for teaching in secondary schools', 1, 3, '2026-04-23 03:31:20', '2026-04-23 03:31:20'),
(4, 'BSBA', 'Bachelor of Science in Business Administration', 'Focus on management, marketing, and finance', 1, 4, '2026-04-23 03:31:20', '2026-04-23 03:31:20'),
(5, 'THEO', 'Theology', 'Study of religious faith, practice, and experience', 1, 5, '2026-04-23 03:31:20', '2026-04-23 03:31:20');

-- --------------------------------------------------------

--
-- Table structure for table `course_enrollment_schedule`
--

CREATE TABLE `course_enrollment_schedule` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `enrollment_start_date` datetime NOT NULL,
  `enrollment_end_date` datetime NOT NULL,
  `max_slots` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_enrollment_schedule`
--

INSERT INTO `course_enrollment_schedule` (`id`, `course_id`, `enrollment_start_date`, `enrollment_end_date`, `max_slots`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-04-10 07:00:00', '2026-05-10 19:00:00', NULL, '2026-04-23 04:10:03', '2026-04-23 04:10:03'),
(2, 2, '2026-04-10 07:00:00', '2026-05-10 19:00:00', NULL, '2026-04-23 04:53:35', '2026-04-23 04:53:35'),
(3, 3, '2026-04-10 07:00:00', '2026-05-10 19:00:00', NULL, '2026-04-23 04:56:13', '2026-04-23 04:56:13'),
(4, 4, '2026-04-10 07:00:00', '2026-05-10 19:00:00', NULL, '2026-04-23 04:56:13', '2026-04-23 04:56:13'),
(5, 5, '2026-04-10 07:00:00', '2026-05-10 19:00:00', NULL, '2026-04-23 04:56:23', '2026-04-23 04:56:23');

-- --------------------------------------------------------

--
-- Table structure for table `curriculum`
--

CREATE TABLE `curriculum` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `subject_code` varchar(50) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `year_level` int(11) NOT NULL,
  `semester` int(11) NOT NULL,
  `units` int(11) NOT NULL DEFAULT 3,
  `description` text DEFAULT NULL,
  `prerequisites` text DEFAULT NULL,
  `professor_id` int(11) DEFAULT NULL,
  `is_offered` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `curriculum`
--

INSERT INTO `curriculum` (`id`, `course_id`, `subject_code`, `subject_name`, `year_level`, `semester`, `units`, `description`, `prerequisites`, `professor_id`, `is_offered`, `is_active`, `created_at`, `updated_at`) VALUES
(208, 1, 'GEED 101', 'Understanding the Self', 1, 1, 3, 'Understanding the Self', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(209, 1, 'GEED 102', 'Readings in the Philippine History', 1, 1, 3, 'Readings in the Philippine History', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(210, 1, 'GEED 103', 'The Contemporary World', 1, 1, 3, 'The Contemporary World', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(211, 1, 'GEED 104', 'Mathematics in the Modern World', 1, 1, 3, 'Mathematics in the Modern World', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(212, 1, 'ENG 101', 'Communication Skills for IT', 1, 1, 3, 'Communication Skills for IT', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(213, 1, 'FIL 101', 'Komunikasyon sa Akademikong Filipino', 1, 1, 3, 'Komunikasyon sa Akademikong Filipino', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(214, 1, 'THEO 101', 'New Testament Survey', 1, 1, 3, 'New Testament Survey', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(215, 1, 'NSTP 1/ ROTC 1', 'National Service Training Program 1/ Reserve Officer Training Corps 1', 1, 1, 3, 'National Service Training Program 1/ Reserve Officer Training Corps 1', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(216, 1, 'PHED 101', 'Rhythmic Activities', 1, 1, 2, 'Rhythmic Activities', 'NONE', NULL, 0, 1, '2026-05-04 19:22:19', '2026-05-04 19:22:19'),
(217, 1, 'GEED 105', 'Purposive Communication', 1, 1, 3, 'Purposive Communication', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(218, 1, 'GEED 106', 'Art Appreciation', 1, 1, 3, 'Art Appreciation', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(219, 1, 'GEED 107', 'Science, Technology and Society', 1, 1, 3, 'Science, Technology and Society', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(220, 1, 'ENG 102', 'Technical and Report Writing', 1, 1, 3, 'Technical and Report Writing', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(221, 1, 'FIL 102', 'Pagbasa at Pagsulat Tungo sa Pananaliksik', 1, 1, 3, 'Pagbasa at Pagsulat Tungo sa Pananaliksik', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(222, 1, 'NAT SCI 101', 'Biological Science', 1, 1, 3, 'Biological Science', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(223, 1, 'THEO 102', 'Old Testament Survey', 1, 1, 3, 'Old Testament Survey', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(224, 1, 'NSTP 2/ ROTC 2', 'National Service Training Program 2/ Reserve Officer Training Corps 2', 1, 1, 3, 'National Service Training Program 2/ Reserve Officer Training Corps 2', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(225, 1, 'PHED 102', 'Rhythmic Activities', 1, 1, 2, 'Rhythmic Activities', 'NONE', NULL, 0, 1, '2026-05-04 19:22:37', '2026-05-04 19:22:37'),
(226, 1, 'MS 101', 'Discrete Mathematics', 1, 2, 3, 'Discrete Mathematics', 'NONE', NULL, 0, 1, '2026-05-04 19:23:05', '2026-05-04 19:23:05'),
(227, 1, 'NET 101', 'Networking 1', 1, 2, 3, 'Networking 1', 'NONE', NULL, 0, 1, '2026-05-04 19:23:05', '2026-05-04 19:23:05'),
(228, 1, 'IPT 101', 'Integrative Programming and Technologies 1', 1, 2, 3, 'Integrative Programming and Technologies 1', 'NONE', NULL, 0, 1, '2026-05-04 19:23:05', '2026-05-04 19:23:05'),
(229, 1, 'IT ELEC 101', 'Web Systems and Technologies', 1, 2, 3, 'Web Systems and Technologies', 'NONE', NULL, 0, 1, '2026-05-04 19:23:05', '2026-05-04 19:23:05'),
(230, 1, 'CC 102', 'Programming 2', 1, 2, 3, 'Programming 2', 'CC 101', NULL, 0, 1, '2026-05-04 19:23:05', '2026-05-04 19:23:05'),
(231, 1, 'SIA 101', 'Systems Integration and Architecture 1', 1, 2, 3, 'Systems Integration and Architecture 1', 'IPT 101', NULL, 0, 1, '2026-05-04 19:23:05', '2026-05-04 19:23:05'),
(232, 1, 'THEO 104', 'Church History 2', 1, 2, 3, 'Church History 2', 'NONE', NULL, 0, 1, '2026-05-04 19:23:05', '2026-05-04 19:23:05'),
(233, 1, 'PHED 104', 'Swimming', 1, 2, 2, 'Swimming', 'NONE', NULL, 0, 1, '2026-05-04 19:23:05', '2026-05-04 19:23:05');

-- --------------------------------------------------------

--
-- Table structure for table `enrollees`
--

CREATE TABLE `enrollees` (
  `id` int(11) NOT NULL,
  `pre_reg_number` varchar(20) NOT NULL,
  `existing_student_id` varchar(20) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `guardian_contact` varchar(20) DEFAULT NULL,
  `fb_name` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `year_level` int(11) DEFAULT 1,
  `status` varchar(20) DEFAULT 'pre-registered',
  `enrollment_type` varchar(20) DEFAULT 'new',
  `application_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_date` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `enrollees`
--
DELIMITER $$
CREATE TRIGGER `before_insert_enrollee` BEFORE INSERT ON `enrollees` FOR EACH ROW BEGIN
    IF NEW.pre_reg_number IS NULL OR NEW.pre_reg_number = '' THEN
        SET NEW.pre_reg_number = generate_pre_reg_number();
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `enrollment_settings`
--

CREATE TABLE `enrollment_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `auto_close_accounts` enum('never','after_semester','after_academic_year') DEFAULT 'never',
  `strict_enrollment_windows` tinyint(1) DEFAULT 0,
  `auto_progression` tinyint(1) DEFAULT 1,
  `system_close_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollment_settings`
--

INSERT INTO `enrollment_settings` (`id`, `auto_close_accounts`, `strict_enrollment_windows`, `auto_progression`, `system_close_date`, `created_at`, `updated_at`) VALUES
(1, 'never', 0, 0, NULL, '2026-04-23 03:31:20', '2026-04-23 04:53:33');

-- --------------------------------------------------------

--
-- Table structure for table `permission_modules`
--

CREATE TABLE `permission_modules` (
  `id` int(11) NOT NULL,
  `module_slug` varchar(64) NOT NULL,
  `module_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permission_modules`
--

INSERT INTO `permission_modules` (`id`, `module_slug`, `module_name`, `description`, `created_at`) VALUES
(1, 'dashboard', 'Dashboard', 'Access and view the system dashboard', '2026-04-23 03:31:19'),
(2, 'student', 'Students', 'Manage student records and enrollment data', '2026-04-23 03:31:19'),
(3, 'course', 'Courses', 'Manage course catalog and course details', '2026-04-23 03:31:19'),
(4, 'enrollment', 'Enrollment', 'Manage enrolled students and enrollment details', '2026-04-23 03:31:19'),
(5, 'enrollees', 'Enrollees', 'Manage pending and approved enrollees', '2026-04-23 03:31:19'),
(6, 'curriculum', 'Curriculum', 'Manage curriculum and subject schedules', '2026-04-23 03:31:19'),
(7, 'schedule', 'Schedule', 'Manage class schedules and faculty assignments', '2026-04-23 03:31:19'),
(8, 'professor', 'Professors', 'Manage professor information and assignments', '2026-04-23 03:31:19'),
(9, 'administrator', 'Administrators', 'Manage administrator accounts and system access', '2026-04-23 03:31:19'),
(10, 'rolemanagement', 'Role Management', 'Manage system roles and permissions', '2026-04-23 03:31:19'),
(11, 'settings', 'Settings', 'Manage account and system configuration settings', '2026-04-23 03:31:19'),
(12, 'reports', 'Reports', 'View and generate system reports', '2026-04-23 03:31:19');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `is_system`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'superadmin', 'Full system access with all permissions', 1, 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(2, 'admin', 'Administrator access with broad privileges', 1, 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(3, 'staff', 'Staff access with limited editing and enrollment privileges', 1, 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(4, 'professor', 'Professor access with schedule and student view permissions', 1, 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(5, 'student', 'Student access with dashboard and curriculum view only', 1, 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `permission_module_slug` varchar(64) NOT NULL,
  `action` enum('view','create','edit','delete','approve') NOT NULL,
  `is_allowed` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_module_slug`, `action`, `is_allowed`, `created_at`, `updated_at`) VALUES
(1, 2, 'administrator', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(2, 2, 'course', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(3, 2, 'curriculum', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(4, 2, 'dashboard', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(5, 2, 'enrollees', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(6, 2, 'enrollment', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(7, 2, 'professor', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(8, 2, 'reports', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(9, 2, 'rolemanagement', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(10, 2, 'schedule', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(11, 2, 'settings', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(12, 2, 'student', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(16, 2, 'administrator', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(17, 2, 'course', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(18, 2, 'curriculum', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(19, 2, 'dashboard', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(20, 2, 'enrollees', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(21, 2, 'enrollment', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(22, 2, 'professor', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(23, 2, 'reports', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(24, 2, 'rolemanagement', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(25, 2, 'schedule', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(26, 2, 'settings', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(27, 2, 'student', 'create', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(31, 2, 'administrator', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(32, 2, 'course', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(33, 2, 'curriculum', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(34, 2, 'dashboard', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(35, 2, 'enrollees', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(36, 2, 'enrollment', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(37, 2, 'professor', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(38, 2, 'reports', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(39, 2, 'rolemanagement', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(40, 2, 'schedule', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(41, 2, 'settings', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(42, 2, 'student', 'edit', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(46, 2, 'administrator', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(47, 2, 'course', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(48, 2, 'curriculum', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(49, 2, 'dashboard', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(50, 2, 'enrollees', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(51, 2, 'enrollment', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(52, 2, 'professor', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(53, 2, 'reports', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(54, 2, 'rolemanagement', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(55, 2, 'schedule', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(56, 2, 'settings', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(57, 2, 'student', 'delete', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(61, 2, 'administrator', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(62, 2, 'course', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(63, 2, 'curriculum', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(64, 2, 'dashboard', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(65, 2, 'enrollees', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(66, 2, 'enrollment', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(67, 2, 'professor', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(68, 2, 'reports', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(69, 2, 'rolemanagement', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(70, 2, 'schedule', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(71, 2, 'settings', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(72, 2, 'student', 'approve', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(76, 3, 'curriculum', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(77, 3, 'dashboard', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(78, 3, 'settings', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(79, 4, 'curriculum', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(80, 4, 'dashboard', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(81, 4, 'settings', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(82, 4, 'student', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(86, 5, 'curriculum', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(87, 5, 'dashboard', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19'),
(88, 5, 'settings', 'view', 1, '2026-04-23 03:31:19', '2026-04-23 03:31:19');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `student_id` varchar(20) NOT NULL,
  `pre_reg_number` varchar(20) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `guardian_contact` varchar(20) DEFAULT NULL,
  `fb_name` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `profile_photo` text DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `course_id` int(11) NOT NULL,
  `year_level` int(11) DEFAULT 1,
  `enrollment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `finance_status` enum('fully_paid','down_payment','promisory') DEFAULT 'fully_paid',
  `finance_total` decimal(10,2) DEFAULT 0.00,
  `finance_paid` decimal(10,2) DEFAULT 0.00,
  `student_type` enum('regular','irregular') DEFAULT 'regular',
  `status` enum('active','inactive','graduated','transferred') DEFAULT 'active',
  `gpa` decimal(3,2) DEFAULT 0.00,
  `current_semester` tinyint(1) DEFAULT 1,
  `current_academic_year` varchar(20) DEFAULT NULL,
  `batch_number` varchar(30) DEFAULT NULL,
  `graduated_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `archive_reason` varchar(50) DEFAULT NULL,
  `flag_group` enum('faithfulness','kindness','peace','love','self_control','joy','greatfulness','gentleness','patience') DEFAULT NULL,
  `is_account_active` tinyint(1) DEFAULT 1,
  `import_semester` tinyint(1) DEFAULT NULL,
  `progression_status` enum('enrolled','pending_progression','approved_progression') DEFAULT 'enrolled'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_id`, `pre_reg_number`, `first_name`, `last_name`, `middle_name`, `email`, `phone`, `guardian_contact`, `fb_name`, `address`, `profile_photo`, `birth_date`, `gender`, `course_id`, `year_level`, `enrollment_date`, `finance_status`, `finance_total`, `finance_paid`, `student_type`, `status`, `gpa`, `current_semester`, `current_academic_year`, `batch_number`, `graduated_at`, `archived_at`, `archive_reason`, `flag_group`, `is_account_active`, `import_semester`, `progression_status`) VALUES
(560, '2025-0001', NULL, 'Afundar,', 'Villacarlos', 'Marc Eldrich', 'marceldrichafundar@gmail.com', '0912-624-4930', '0919-558-5892', 'Marc Eldrich Afundar', 'Baliwag', 'data:image/jpeg;base64,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', NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'self_control', 1, NULL, 'enrolled'),
(561, '2025-0002', NULL, 'Alvarez,', 'Perio', 'Bhrenn Miguel', 'bhrennmiguelalvarez@gmail.com', '0921-243-7480', '0926-323-8452', 'Bhrenn Miguel Alvarez', 'Ramirez', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'faithfulness', 1, NULL, 'enrolled'),
(562, '2025-0003', NULL, 'Arañas,', 'Diones', 'Khate Cristelle', 'aranaskhate@gmail.com', '0997-065-7463', NULL, 'Khate Diones Arañas', 'Bendita 1', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'gentleness', 1, NULL, 'enrolled'),
(563, '2025-0004', NULL, 'Bello,', 'Aquino', 'Irish Jane', 'belloirishjane6@gmail.com', '0919-433-2059', '0967-512-6366', 'Irish Jane Aquino Bello', 'Bendita 1', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'love', 1, NULL, 'enrolled'),
(564, '2025-0005', NULL, 'Bello,', 'Perpiñan', 'Jhon Simon', 'bellojhonsimon@gmail.com', '0995-849-3577', '0916-102-2802', 'Simon Bello', 'Urdaneta', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'kindness', 1, NULL, 'enrolled'),
(565, '2025-0006', NULL, 'Bello,', 'Tabuy', 'Sean Jacob', 'seanjacobbello34@gmail.com', '0967-571-0536', '0997-332-6615', 'Sean Bello', 'San Agustin', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'patience', 1, NULL, 'enrolled'),
(566, '2025-0007', NULL, 'Bencito,', 'Mesa', 'Reniel', 'renielbencito@gmail.com', '0965-990-9126', '0997-286-3038', 'Reniel Bencito', 'Kabulusan', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'patience', 1, NULL, 'enrolled'),
(567, '2025-0008', NULL, 'Berenguel,', 'Zosa', 'Vonn Denlord De', 'berengueldenlord@gmail.com', '0906-820-3650', '0975-334-0548', 'Vonndenlord Berenguel', 'Pacheco', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'self_control', 1, NULL, 'enrolled'),
(568, '2025-0009', NULL, 'Bersabe,', 'Loyola', 'Jasmin', 'jasminbersabe123@gmail.com', '0965-709-9432', '0960-893-3741', 'Jasmin Bersabe', 'Tua', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'love', 1, NULL, 'enrolled'),
(569, '2025-0010', NULL, 'Crizaldo,', 'Dinlasan', 'Jerard Paul', 'jerardpaulcrizaldo@gmail.com', '0938-892-7348', '0907-604-9881', 'Jerard Paul Dinlasan Crizaldo', 'Bailen', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'self_control', 1, NULL, 'enrolled'),
(570, '2025-0011', NULL, 'Cruz,', 'Sisante', 'Triczie', 'sisantetetriczie@gmail.com', '0962-366-3763', '0906-820-5034', 'Triczie Cruz', 'Kabulusan', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'greatfulness', 1, NULL, 'enrolled'),
(571, '2025-0012', NULL, 'Custodio,', 'Rodriguez', 'Liam Gabriel', 'custodioliam21@gmail.com', '0956-658-7585', '0927-345-3472', 'Liam Gabriel', 'Poblacion 4', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'kindness', 1, NULL, 'enrolled'),
(572, '2025-0013', NULL, 'Dawat,', 'Butial', 'Ricc Justine', 'dawatriccjustine@gmail.com', '0942-746-8472', '0961-826-2794', 'Ricc Justine Dawat', 'Baliwag', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'joy', 1, NULL, 'enrolled'),
(573, '2025-0014', NULL, 'Dela', 'Gutierrez', 'Vega, John Michael', 'johnmichaeldelavega16@gmail.com', '0991-475-1235', '0969-293-8998', 'John Michael', 'Tua', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'patience', 1, NULL, 'enrolled'),
(574, '2025-0015', NULL, 'Estanislao,', 'Climacosa', 'Mikajean', 'estanislaomika@gmail.com', '0955-235-6556', '0916-408-0509', 'Mikajean Estanislao', 'Bendita 1', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'peace', 1, NULL, 'enrolled'),
(575, '2025-0016', NULL, 'Gatchalian,', 'Rosel', 'Ivan', 'gatcaivan394@gmail.com', '0950-364-8989', '0948-354-9779', 'Ivan Gatchalian', 'Tua', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'joy', 1, NULL, 'enrolled'),
(576, '2025-0017', NULL, 'Genio,', 'Alcantara', 'Jade Margarette', 'jadealcantaragenio@gmail.com', '0991-925-8654', '0915-541-0042', 'Jade Margarette', 'Bendita 1', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'faithfulness', 1, NULL, 'enrolled'),
(577, '2025-0018', NULL, 'Hamac,', 'Dadan', 'Liziel', 'hamacliziel@gmail.com', '0953-948-8560', '0935-483-7376', 'Liziel Hamac', 'Pacheco', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'patience', 1, NULL, 'enrolled'),
(578, '2025-0019', NULL, 'Huelba,', 'Rambayan', 'John Audrey', 'huelbajohnaudrey@gmail.com', '0953-506-0545', '0965-437-2049', 'Audrey Huelba', 'Urdaneta', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'kindness', 1, NULL, 'enrolled'),
(579, '2025-0020', NULL, 'Lalogo,', 'Makinano', 'Daryl', 'daryllemakinano@gmail.com', '0965-146-1041', '0935-318-6873', 'Lalogo Daryl', 'Urdaneta', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'love', 1, NULL, 'enrolled'),
(580, '2025-0021', NULL, 'Lamparero,', 'Masangkay', 'Louie', 'lamparerolouie@gmail.com', '0908-651-0267', '0936-702-2607', 'Louie Lamparero', 'Caluangan', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'gentleness', 1, NULL, 'enrolled'),
(581, '2025-0022', NULL, 'Magbago,', 'Gamez', 'Khristine', 'khristinemagbago28@gmail.com', '0993-712-3423', '0997-846-2999', 'Khristine Gamez Magbago', 'Alfonso', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'self_control', 1, NULL, 'enrolled'),
(582, '2025-0023', NULL, 'Maligaya,', 'Agojo', 'Rachelle Anne', 'rachelleannmaligaya@gmail.com', '0992-706-2062', '0991-933-1659', 'Rachelle Anne Maligaya', 'Medina', 'data:image/jpeg;base64,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', NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'irregular', 'inactive', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'joy', 1, NULL, 'enrolled'),
(583, '2025-0024', NULL, 'Malones,', 'Regala', 'Rench Lorenz', 'malonesrenchlorenz@gmail.com', '0916-874-0523', '0995-904-9615', 'Rench Malones', 'Urdaneta', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'gentleness', 1, NULL, 'enrolled'),
(584, '2025-0025', NULL, 'Manlapaz,', 'Gatchalian', 'Jasmine', 'jasminemanlapaz7@gmail.com', '0960-394-1544', '0962-132-4035', 'Jasmine Manlapaz', 'Alfonso', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, NULL, 1, NULL, 'enrolled'),
(585, '2025-0026', NULL, 'Meyor,', 'Harold', 'Mark', 'meyorharold@gmail.com', '0935-711-8340', '0956-831-4086', 'Harold Meyor', 'Urdaneta', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'peace', 1, NULL, 'enrolled'),
(586, '2025-0027', NULL, 'Morete,', 'Mart', 'Jhon', 'johnmartmorete@gmail.com', '0945-377-0803', NULL, 'Johnmart Morete', 'Bendita 1', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'faithfulness', 1, NULL, 'enrolled'),
(587, '2025-0028', NULL, 'Obrador,', 'Lampedario', 'Jed Russel', 'obradorjedrussel86@gmail.com', '0953-641-6791', '0991-992-8272', 'Jed Russel Obrador', 'Nasugbu', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'love', 1, NULL, 'enrolled'),
(588, '2025-0029', NULL, 'Padolina,', 'Alla', 'Wilhelm Carl', 'wilhelmpadolina73@gmail.com', '0950-916-5952', '0938-405-7094', 'Wilhelm Padolina', 'Medina', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'faithfulness', 1, NULL, 'enrolled'),
(589, '2025-0030', NULL, 'Paiton,', 'Consumo', 'Mark James', 'paitonmarkjames@gmail.com', '0945-150-7409', '0916-207-7534', 'Mark James Paiton', 'Bendita 2', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'peace', 1, NULL, 'enrolled'),
(590, '2025-0031', NULL, 'Peregrino,', 'Dimapilis', 'Lindsey Jade', 'lindseyjadedperegrino@gmail.com', '0981-454-4879', '0915-839-7405', 'Lindsey Jade D. Peregrino', 'Bendita 2', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'greatfulness', 1, NULL, 'enrolled'),
(591, '2025-0032', NULL, 'Rogador,', 'Visto', 'Justin Frylle', 'justinfryllerogador@gmail.com', '0905-245-8043', '0906-769-0900', 'Justin Rogador', 'Urdaneta', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'kindness', 1, NULL, 'enrolled'),
(592, '2025-0033', NULL, 'Sevilla,', 'Xavier', 'Shan', 'sevillashanxavier@gmail.com', '0905-364-8011', '0905-364-8011', 'Shan Xavier', 'Nasugbu', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'patience', 1, NULL, 'enrolled'),
(593, '2025-0034', NULL, 'Trajico,', 'Costa', 'Charles Wendell', 'charlieputt@gmail.com', '0994-645-1272', '0926-754-1736', 'Charles Costa Trajico', 'Alfonso', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'kindness', 1, NULL, 'enrolled'),
(594, '2025-0035', NULL, 'Viadoy,', 'Raca', 'Lance Joshua', 'lancejoshuaviadoy@gmail.com', '0975-337-2972', NULL, 'Lance Viadoy', 'Bendita 2', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'patience', 1, NULL, 'enrolled'),
(595, '2025-0036', NULL, 'Villacarlos,', 'Bendana', 'Raishelle Anne', 'villacarlosraishelleanne@gmail.com', '0906-141-4509', '0936-746-5915', 'Raishelle Anne Villacarlos', 'Tua', NULL, NULL, 'Female', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'peace', 1, NULL, 'enrolled'),
(596, '2025-0037', NULL, 'Zoleta,', 'Aviñante', 'Jhon Christian', 'zoletajohnchristian41@gmail.com', '0956-245-3768', '0915-462-1549', 'Jhon Christian Avinante Zoleta', 'Nasugbu', NULL, NULL, 'Male', 1, 1, '2026-05-03 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'patience', 1, NULL, 'enrolled'),
(597, '2025-0038', NULL, 'Atienza,', 'Lavarias', 'Dale Vincent', 'atienzadale2@gmail.com', '0928-247-0449', '0907-342-2486', 'Dale Atienza', 'Medina', NULL, NULL, 'Male', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'peace', 1, NULL, 'enrolled'),
(598, '2025-0039', NULL, 'Bakiao,', 'Bidbid', 'Jean Katrice', 'bakiaokath02@gmail.com', '0956-063-1986', '0916-672-4347', 'Katrice B. Bakiao', 'Ramirez', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'joy', 1, NULL, 'enrolled'),
(599, '2025-0040', NULL, 'Castriciones,', 'Villa', 'Aisa Marie', 'aisamariecastriciones@gmail.com', '0955-352-4119', '0930-701-0659', 'Aisa Marie Castriciones', 'Bendita 1', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'kindness', 1, NULL, 'enrolled'),
(600, '2025-0041', NULL, 'Custodio,', 'Cal', 'Guian Ross', 'guianrosscustodio@gmail.com', '0905-388-3169', '0975-696-1336', 'Guian Custodio', 'Bendita II', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'joy', 1, NULL, 'enrolled'),
(601, '2025-0042', NULL, 'Erasmo,', 'Papa', 'Javen Maeane', 'erasmojaven@gmail.com', '0928-967-0720', '0977-344-5708', 'Javenmaene Erasmo', 'Bendita 1', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'faithfulness', 1, NULL, 'enrolled'),
(602, '2025-0043', NULL, 'Flores,', 'Escorido', 'Cariza Joy', 'florescariza914@gmail.com', '0967-948-0600', '0967-928-2991', 'Flores Cariza', 'Bendita II', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'gentleness', 1, NULL, 'enrolled'),
(603, '2025-0044', NULL, 'Hernan,', 'Guzon', 'Keana Alexis', 'hernankeyana@gmail.com', '0962-944-1991', '0997-083-6607', 'Keana Alexis', 'Tua', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'faithfulness', 1, NULL, 'enrolled'),
(604, '2025-0045', NULL, 'Icasiano,', 'Maranan', 'Jamilla', 'jamillaicasiano00@gmail.com', '0955-514-4352', '0935-022-5125', 'Jamilla Icasiano', 'Urdaneta', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'self_control', 1, NULL, 'enrolled'),
(605, '2025-0046', NULL, 'Maning,', 'Macapilit', 'Rebie Richer', 'maningrebiericher11@gmail.com', '0951-633-9674', '0939-817-2580', 'Rebie Richer Maning', 'Alfonso', NULL, NULL, 'Male', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'kindness', 1, NULL, 'enrolled'),
(606, '2025-0047', NULL, 'Toledo,', 'Lique', 'Ashley', 'liqueashley5@gmail.com', '0994-839-4923', '0981-326-5046', 'Ashley Lique', 'Nasugbu', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'joy', 1, NULL, 'enrolled'),
(607, '2025-0048', NULL, 'Dela', 'Sismaet', 'Cuesta, Yheinelle Asher', 'asherdelacuesta@gmail.com', '0936-896-3512', '0919-549-3895', 'Ash dela Cuesta', 'San Agustin', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'gentleness', 1, NULL, 'enrolled'),
(608, '2025-0049', NULL, 'Rabang,', 'Palma', 'Angel Ann', 'angelrabang534@gmail.com', '0962-944-8168', '0966-649-3110', 'Angel Rabang', 'Brgy.5', NULL, NULL, 'Female', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'gentleness', 1, NULL, 'enrolled'),
(609, '2025-0050', NULL, 'Silagan,', 'Salorsano', 'Bryan Angelo', 'bryanangelosilagan@gmail.com', '0962-976-1013', '0945-602-2205', 'Bryan Silagan', 'Brgy. 1', NULL, NULL, 'Male', 3, 1, '2026-05-04 16:00:00', 'fully_paid', 0.00, 0.00, 'regular', 'active', 0.00, 1, '2025-2026', '2025', NULL, NULL, NULL, 'patience', 1, NULL, 'enrolled');

--
-- Triggers `students`
--
DELIMITER $$
CREATE TRIGGER `before_insert_student` BEFORE INSERT ON `students` FOR EACH ROW BEGIN
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
        SET NEW.student_id = generate_student_id();
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `student_curriculum_assignments`
--

CREATE TABLE `student_curriculum_assignments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `curriculum_id` int(11) NOT NULL,
  `source_year_level` int(11) NOT NULL,
  `source_semester` int(11) NOT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `assigned_by` int(11) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_curriculum_assignments`
--

INSERT INTO `student_curriculum_assignments` (`id`, `student_id`, `curriculum_id`, `source_year_level`, `source_semester`, `is_completed`, `assigned_by`, `assigned_at`, `completed_at`) VALUES
(1, 582, 212, 1, 1, 0, 1, '2026-05-06 10:58:23', NULL),
(2, 582, 220, 1, 1, 0, 1, '2026-05-06 10:58:23', NULL),
(3, 582, 231, 1, 2, 0, 1, '2026-05-06 10:58:23', NULL),
(4, 582, 232, 1, 2, 0, 1, '2026-05-06 10:58:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_enrolled_subjects`
--

CREATE TABLE `student_enrolled_subjects` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `curriculum_id` int(11) NOT NULL,
  `offering_id` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'enrolled',
  `enrolled_at` datetime NOT NULL DEFAULT current_timestamp(),
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_enrolled_subjects`
--

INSERT INTO `student_enrolled_subjects` (`id`, `student_id`, `curriculum_id`, `offering_id`, `status`, `enrolled_at`, `approved_at`, `approved_by`) VALUES
(566, 574, 212, 218, 'enrolled', '2026-05-10 14:47:05', '2026-05-10 14:47:05', NULL),
(567, 574, 220, 219, 'enrolled', '2026-05-10 14:47:05', '2026-05-10 14:47:05', NULL),
(568, 574, 213, 220, 'enrolled', '2026-05-10 14:47:05', '2026-05-10 14:47:05', NULL),
(569, 574, 221, 221, 'enrolled', '2026-05-10 14:47:05', '2026-05-10 14:47:05', NULL),
(570, 574, 208, 222, 'enrolled', '2026-05-10 14:47:06', '2026-05-10 14:47:06', NULL),
(571, 574, 209, 223, 'enrolled', '2026-05-10 14:47:06', '2026-05-10 14:47:06', NULL),
(572, 574, 210, 224, 'enrolled', '2026-05-10 14:47:06', '2026-05-10 14:47:06', NULL),
(573, 574, 211, 225, 'enrolled', '2026-05-10 14:47:06', '2026-05-10 14:47:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_records_archive`
--

CREATE TABLE `student_records_archive` (
  `id` int(11) NOT NULL,
  `student_pk` int(11) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `course_code` varchar(20) DEFAULT NULL,
  `course_name` varchar(100) DEFAULT NULL,
  `year_level` int(11) DEFAULT 1,
  `current_semester` tinyint(1) DEFAULT NULL,
  `current_academic_year` varchar(20) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'graduated',
  `graduated_at` datetime DEFAULT NULL,
  `archived_at` datetime NOT NULL DEFAULT current_timestamp(),
  `archive_reason` varchar(50) NOT NULL DEFAULT 'graduated_3_years',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subject_offerings`
--

CREATE TABLE `subject_offerings` (
  `id` int(11) NOT NULL,
  `curriculum_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `year_level` tinyint(4) NOT NULL,
  `semester` tinyint(4) NOT NULL,
  `academic_year` varchar(9) DEFAULT NULL,
  `offered_by` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `archived_at` datetime DEFAULT NULL,
  `offered_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subject_offerings`
--

INSERT INTO `subject_offerings` (`id`, `curriculum_id`, `course_id`, `year_level`, `semester`, `academic_year`, `offered_by`, `is_active`, `archived_at`, `offered_at`, `updated_at`) VALUES
(218, 212, 1, 1, 1, '2025-2026', 1, 1, NULL, '2026-05-06 15:33:45', '2026-05-06 15:33:45'),
(219, 220, 1, 1, 1, '2025-2026', 1, 1, NULL, '2026-05-06 15:33:45', '2026-05-06 15:33:45'),
(220, 213, 1, 1, 1, '2025-2026', 1, 1, NULL, '2026-05-06 15:33:45', '2026-05-06 15:33:45'),
(221, 221, 1, 1, 1, '2025-2026', 1, 1, NULL, '2026-05-06 15:33:45', '2026-05-06 15:33:45'),
(222, 208, 1, 1, 1, '2025-2026', 1, 1, NULL, '2026-05-06 15:33:45', '2026-05-06 15:33:45'),
(223, 209, 1, 1, 1, '2025-2026', 1, 1, NULL, '2026-05-06 15:33:45', '2026-05-06 15:33:45'),
(224, 210, 1, 1, 1, '2025-2026', 1, 1, NULL, '2026-05-06 15:33:45', '2026-05-06 15:33:45'),
(225, 211, 1, 1, 1, '2025-2026', 1, 1, NULL, '2026-05-06 15:33:45', '2026-05-06 15:33:45');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `profile_photo` mediumtext DEFAULT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'staff',
  `role_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `session_version` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `full_name`, `phone`, `address`, `birth_date`, `gender`, `profile_photo`, `role`, `role_id`, `is_active`, `last_login`, `session_version`, `created_at`, `updated_at`) VALUES
(1, 'superadmin', '$2y$10$oGQX5vuBPFvTy7UPtvHXPu2QOAtXZJrMctrUPYXiwnWARSh0SYVby', 'hazelantazo4@gmail.com', 'Super Admin', NULL, NULL, NULL, NULL, NULL, 'superadmin', 1, 1, '2026-05-16 11:44:03', 14, '2026-04-23 03:31:19', '2026-05-16 11:44:03'),
(566, 'marceldrichafundar@gmail.com', '$2y$10$yHLryXyR2okRL659sIaDW.tMqehey9fpwPTPJvOqSQ2xlHj9xLhIy', 'marceldrichafundar@gmail.com', 'Afundar, Villacarlos', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-05 15:55:23'),
(567, 'bhrennmiguelalvarez@gmail.com', '$2y$10$sJTO428/0eA5Ta.EgUCSi.vqW/TZuOIT8RDhSr9I5aAgJOe8C7Wh6', 'bhrennmiguelalvarez@gmail.com', 'Alvarez, Bhrenn Miguel Perio', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(568, 'aranaskhate@gmail.com', '$2y$10$JtJA.uC7WDLNMGKY7A66meO3m1mETP9tqDlJhLstvZH1rrr3YhXTq', 'aranaskhate@gmail.com', 'Arañas, Khate Cristelle Diones', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(569, 'belloirishjane6@gmail.com', '$2y$10$A2JNsfkyv3FsDCQP6N50muuFejbAqPYCafICz.AXUqQBXQPouMbj6', 'belloirishjane6@gmail.com', 'Bello, Irish Jane Aquino', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(570, 'bellojhonsimon@gmail.com', '$2y$10$KSWqPRI7hiWnU11pZtVupeNCOkmSGk82jnJM7aDyETdrB4.GPuWcy', 'bellojhonsimon@gmail.com', 'Bello, Jhon Simon Perpiñan', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(571, 'seanjacobbello34@gmail.com', '$2y$10$bDkyOQlxXOKQugAhM16fAOJj4u0a86IYebTuUiJ5IP/cj.i1i8RSu', 'seanjacobbello34@gmail.com', 'Bello, Sean Jacob Tabuy', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(572, 'renielbencito@gmail.com', '$2y$10$STHtt7/Xa83BObYayKlIOOu/kTPCvx0HzYj.9ALFsMMgkcJ7.2KDK', 'renielbencito@gmail.com', 'Bencito, Reniel Mesa', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(573, 'berengueldenlord@gmail.com', '$2y$10$2jZb6/Pzp6OYPzQgrtsM6e90NU8.Kn6M1kaNbIexOh5Kpp922MBUS', 'berengueldenlord@gmail.com', 'Berenguel, Vonn Denlord De Zosa', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(574, 'jasminbersabe123@gmail.com', '$2y$10$gb5ioUP583JO.E4DoD3qZe/WKNy/DNPh6nSSsuDnCsP5jOQbJF322', 'jasminbersabe123@gmail.com', 'Bersabe, Jasmin Loyola', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(575, 'jerardpaulcrizaldo@gmail.com', '$2y$10$sGM5zTVWT8uRRkyeE0hxpeeRM4.JiAyE1fMF2LfsoPOFbfMz./Q8m', 'jerardpaulcrizaldo@gmail.com', 'Crizaldo, Jerard Paul Dinlasan', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:28', '2026-05-04 14:59:28'),
(576, 'sisantetetriczie@gmail.com', '$2y$10$B.eg.UOoFhkkApn.8axaCODbEbf3/H78S8khffros6rCxGg19NICS', 'sisantetetriczie@gmail.com', 'Cruz, Triczie Sisante', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(577, 'custodioliam21@gmail.com', '$2y$10$Zw.JReWZjiUVwYuKbsoH6.ceVNJQTSXySK8UIqFp4VLSiMeOY0Abe', 'custodioliam21@gmail.com', 'Custodio, Liam Gabriel Rodriguez', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(578, 'dawatriccjustine@gmail.com', '$2y$10$z2aJN/og.bteDkm5H.cRaeB3ylNZh8c7sxpSqJ0r5trSRj03Vx3Tu', 'dawatriccjustine@gmail.com', 'Dawat, Ricc Justine Butial', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(579, 'johnmichaeldelavega16@gmail.com', '$2y$10$gq/GRZcme4GifCWgAudTI.SdVfWqrSF7Ox2FjM1OEndKlriyq2nw.', 'johnmichaeldelavega16@gmail.com', 'Dela Vega, John Michael Gutierrez', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(580, 'estanislaomika@gmail.com', '$2y$10$iAt.O.tMIungq/LCv3vYpuLI4.bjnmyjUJMm4BctqqYvTlmk88fK6', 'estanislaomika@gmail.com', 'Estanislao, Mikajean Climacosa', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, '2026-05-10 04:50:52', 1, '2026-05-04 14:59:29', '2026-05-10 04:50:52'),
(581, 'gatcaivan394@gmail.com', '$2y$10$vcuwo9DCdU43zcv6tiHHwe/A.r6FVhD9hxsack9NdSYVsZd2BCafm', 'gatcaivan394@gmail.com', 'Gatchalian, Ivan Rosel', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(582, 'jadealcantaragenio@gmail.com', '$2y$10$xV7yzvXg1QDfsctLgV7M9.Xq4sxG2/4KJLAlHLL5CEWMXSGptmFmm', 'jadealcantaragenio@gmail.com', 'Genio, Jade Margarette Alcantara', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, '2026-05-16 12:01:10', 1, '2026-05-04 14:59:29', '2026-05-16 12:01:10'),
(583, 'hamacliziel@gmail.com', '$2y$10$.756qFY8JoWSb62ENoDWJOYSKvpFdECPPcQ8IYI978llTvO1uMmBS', 'hamacliziel@gmail.com', 'Hamac, Liziel Dadan', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(584, 'huelbajohnaudrey@gmail.com', '$2y$10$G4atQSBYpbbpv986hxOOzOKNtKEl5UXlW2u/Irzrlr6As04J/NIIq', 'huelbajohnaudrey@gmail.com', 'Huelba, John Audrey Rambayan', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(585, 'daryllemakinano@gmail.com', '$2y$10$Atf57O78yyrVFnJKJo692.sAtMHkDbes9VH.InbF7eKHuvGH//dom', 'daryllemakinano@gmail.com', 'Lalogo, Daryl Makinano', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(586, 'lamparerolouie@gmail.com', '$2y$10$0XKdcEE7Lwn1MctHKZb4XepKx5PUT25JS3SRvXvbWl52l3009ZYES', 'lamparerolouie@gmail.com', 'Lamparero, Louie Masangkay', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:29', '2026-05-04 14:59:29'),
(587, 'khristinemagbago28@gmail.com', '$2y$10$82dWieZkThQ0KiTWu8tNHebnIzyobbzi5A2IJnPLDpj7xYySoTIBS', 'khristinemagbago28@gmail.com', 'Magbago, Khristine Gamez', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(588, 'rachelleannmaligaya@gmail.com', '$2y$10$XsC9dStBdYZeTwGksI1Bo.xa2dWZBL.N4mKrsqMHWQzCGU.FyDCc6', 'rachelleannmaligaya@gmail.com', 'Maligaya, Agojo', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-06 03:26:00'),
(589, 'malonesrenchlorenz@gmail.com', '$2y$10$RECLasE3dcVeNwuTAkZ.UOX54afOPh44g/sWZVxMxM40AW9g7hb12', 'malonesrenchlorenz@gmail.com', 'Malones, Rench Lorenz Regala', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(590, 'jasminemanlapaz7@gmail.com', '$2y$10$jGIQWKWTXCHVwF9IDPKCx.3HLrC6ZKBg.c6ppk4r/L4VU8HEGfWYK', 'jasminemanlapaz7@gmail.com', 'Manlapaz, Jasmine Gatchalian', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(591, 'meyorharold@gmail.com', '$2y$10$jL7YxkqBLX0O5G7X4pLEheVDE19FUSLm2RXeoBSUpAbnjknkWjJoG', 'meyorharold@gmail.com', 'Meyor, Mark Harold', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(592, 'johnmartmorete@gmail.com', '$2y$10$LpJ1hJn01Fu1rUajewVLaudBYU/L/jOs1DDYDNpz4VpxBck7jckqW', 'johnmartmorete@gmail.com', 'Morete, Jhon Mart', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(593, 'obradorjedrussel86@gmail.com', '$2y$10$iuuAEMzIVYD88oZhaB3d9eNtYR/WXFUg4eRZeX1pqc4xBNxxCzUfm', 'obradorjedrussel86@gmail.com', 'Obrador, Jed Russel Lampedario', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(594, 'wilhelmpadolina73@gmail.com', '$2y$10$ij6meherQrOKHNT4L.xyuO9kZ6wwcro71.E4cPAPu9cJoV90FIDI.', 'wilhelmpadolina73@gmail.com', 'Padolina, Wilhelm Carl Alla', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(595, 'paitonmarkjames@gmail.com', '$2y$10$QZRkc3njbzuYvYinPo0A6OFrKyrPg4iUW6GX68X1Xf91w.PlEj8uO', 'paitonmarkjames@gmail.com', 'Paiton, Mark James Consumo', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(596, 'lindseyjadedperegrino@gmail.com', '$2y$10$NkFNEBePtLpPFlghcXZ.9uN8wZOrjQ.YvNjcyocgcTjOWSkvzjVh2', 'lindseyjadedperegrino@gmail.com', 'Peregrino, Lindsey Jade Dimapilis', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(597, 'justinfryllerogador@gmail.com', '$2y$10$Yjn9uu..nKTqYI9Zs/C8xeVFtABZuA9Owtiv2s0la.Fr9PWsBEmNC', 'justinfryllerogador@gmail.com', 'Rogador, Justin Frylle Visto', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(598, 'sevillashanxavier@gmail.com', '$2y$10$5zpDlHkkaTZ0p4AKElFP3ubmYLR2JqNHF8K1sHuSkswPoZe5VL5Oa', 'sevillashanxavier@gmail.com', 'Sevilla, Shan Xavier', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:30', '2026-05-04 14:59:30'),
(599, 'charlieputt@gmail.com', '$2y$10$Y1DMioxWuQpBKdMDZPB3C.pWhhjB5EGPRXkSxiKg4Ctug91IWdCS.', 'charlieputt@gmail.com', 'Trajico, Charles Wendell Costa', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:31', '2026-05-04 14:59:31'),
(600, 'lancejoshuaviadoy@gmail.com', '$2y$10$w3skYiGLh9rjSzEAsvOk7uwhCI0EdFtxfdPfTFneMbJifdeG8.t7O', 'lancejoshuaviadoy@gmail.com', 'Viadoy, Lance Joshua Raca', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:31', '2026-05-04 14:59:31'),
(601, 'villacarlosraishelleanne@gmail.com', '$2y$10$IwyNYsmswYdFTE9GeXgE1.UPPeUTi8o9YDeC0pDGqpJNNmN.JjR3K', 'villacarlosraishelleanne@gmail.com', 'Villacarlos, Raishelle Anne Bendana', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:31', '2026-05-04 14:59:31'),
(602, 'zoletajohnchristian41@gmail.com', '$2y$10$RgbHb4gh.Xyp3OrARpps0.tG.jJ3c9ECa5RyV3mmT0orcN5Jk4.HS', 'zoletajohnchristian41@gmail.com', 'Zoleta, Jhon Christian Aviñante', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-04 14:59:31', '2026-05-04 14:59:31'),
(603, 'atienzadale2@gmail.com', '$2y$10$6f6PNEeMNXed/hugF7VAlORB3ZaEf5KoqLZCp9vey53BcUvf.7MPm', 'atienzadale2@gmail.com', 'Atienza, Dale Vincent Lavarias', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:49', '2026-05-05 20:09:49'),
(604, 'bakiaokath02@gmail.com', '$2y$10$J0fR4/fucOa2048AWdU/WekggMwtxXjoP1Y/IxqLbFoC.SLCfd10S', 'bakiaokath02@gmail.com', 'Bakiao, Jean Katrice Bidbid', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, '2026-05-10 04:50:06', 1, '2026-05-05 20:09:49', '2026-05-10 04:50:06'),
(605, 'aisamariecastriciones@gmail.com', '$2y$10$6s1SVPdupHZ8U8FT/sL6RuHNAmg1ipNRRcuw6Ted/KCGII6.h38a6', 'aisamariecastriciones@gmail.com', 'Castriciones, Aisa Marie Villa', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:49', '2026-05-05 20:09:49'),
(606, 'guianrosscustodio@gmail.com', '$2y$10$TttV4/aB5k.cNEPu.yDgguxfBGjyb1wo8Yl3jDG7TRmto3F0AFCsS', 'guianrosscustodio@gmail.com', 'Custodio, Guian Ross Cal', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:49', '2026-05-05 20:09:49'),
(607, 'erasmojaven@gmail.com', '$2y$10$g1iQKGo8gG8B5lg8nOWCFOR606Jsknec4IbigxyhX3x2j9Nd6ZlBu', 'erasmojaven@gmail.com', 'Erasmo, Javen Maeane Papa', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:49', '2026-05-05 20:09:49'),
(608, 'florescariza914@gmail.com', '$2y$10$uc4TZX6nFoSIa6WoIAnWrOwUxbSYbNOClcyiO1YAGb8fUEDAf107y', 'florescariza914@gmail.com', 'Flores, Cariza Joy Escorido', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:49', '2026-05-05 20:09:49'),
(609, 'hernankeyana@gmail.com', '$2y$10$2yy8G1w/CLAvBgu3xV8Tnu.PVBP/zfVstEQDmZ6ZWuQEvrtXf9rAS', 'hernankeyana@gmail.com', 'Hernan, Keana Alexis Guzon', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:50', '2026-05-05 20:09:50'),
(610, 'jamillaicasiano00@gmail.com', '$2y$10$l2jaLkqylyihhIRyQlFALO1omsnUWFG7c4JvD77stHN7PyVk9VZi2', 'jamillaicasiano00@gmail.com', 'Icasiano, Jamilla Maranan', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:50', '2026-05-05 20:09:50'),
(611, 'maningrebiericher11@gmail.com', '$2y$10$JWFMQSQLB/CDU3Zh1jBMgOofOTqaZBRAuRHsnRPUbPvw2MKynD9sC', 'maningrebiericher11@gmail.com', 'Maning, Rebie Richer Macapilit', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:50', '2026-05-05 20:09:50'),
(612, 'liqueashley5@gmail.com', '$2y$10$eFtteUaFY8kcMa8vF1keQezbabwUDdoiC3eOFXY4eKMvJDGjUgv7.', 'liqueashley5@gmail.com', 'Toledo, Ashley Lique', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:50', '2026-05-05 20:09:50'),
(613, 'asherdelacuesta@gmail.com', '$2y$10$6UbAjE4QhB5AWWqopjcWmuiTwfDaa7UvLqh9VFQQHUcL717guFd6S', 'asherdelacuesta@gmail.com', 'Dela Cuesta, Yheinelle Asher Sismaet', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:50', '2026-05-05 20:09:50'),
(614, 'angelrabang534@gmail.com', '$2y$10$m2RxOgW58GPtyBQxYtlZkevK796uphfDOZdL7m9KxxEykVPxXqFsC', 'angelrabang534@gmail.com', 'Rabang, Angel Ann Palma', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:50', '2026-05-05 20:09:50'),
(615, 'bryanangelosilagan@gmail.com', '$2y$10$/9fqWcmZP4YJnqBfCjbbGOhYIv4tUTOhngs8mh0hqo/MNDIfnbVUW', 'bryanangelosilagan@gmail.com', 'Silagan, Bryan Angelo Salorsano', NULL, NULL, NULL, NULL, NULL, 'student', 5, 1, NULL, NULL, '2026-05-05 20:09:51', '2026-05-05 20:09:51');

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_active_curriculum`
-- (See below for the actual view)
--
CREATE TABLE `view_active_curriculum` (
`id` int(11)
,`course_code` varchar(10)
,`course_name` varchar(100)
,`subject_code` varchar(50)
,`subject_name` varchar(100)
,`year_level` int(11)
,`semester` int(11)
,`units` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_active_students_by_course`
-- (See below for the actual view)
--
CREATE TABLE `view_active_students_by_course` (
`student_id` varchar(20)
,`first_name` varchar(50)
,`last_name` varchar(50)
,`email` varchar(100)
,`course_code` varchar(10)
,`course_name` varchar(100)
,`year_level` int(11)
,`current_semester` tinyint(1)
,`current_academic_year` varchar(20)
,`gpa` decimal(3,2)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_pending_enrollees`
-- (See below for the actual view)
--
CREATE TABLE `view_pending_enrollees` (
`id` int(11)
,`pre_reg_number` varchar(20)
,`first_name` varchar(50)
,`last_name` varchar(50)
,`email` varchar(100)
,`phone` varchar(20)
,`course_code` varchar(10)
,`course_name` varchar(100)
,`year_level` int(11)
,`application_date` timestamp
);

-- --------------------------------------------------------

--
-- Structure for view `view_active_curriculum`
--
DROP TABLE IF EXISTS `view_active_curriculum`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_active_curriculum`  AS SELECT `cur`.`id` AS `id`, `c`.`course_code` AS `course_code`, `c`.`course_name` AS `course_name`, `cur`.`subject_code` AS `subject_code`, `cur`.`subject_name` AS `subject_name`, `cur`.`year_level` AS `year_level`, `cur`.`semester` AS `semester`, `cur`.`units` AS `units` FROM (`curriculum` `cur` join `courses` `c` on(`cur`.`course_id` = `c`.`id`)) WHERE `cur`.`is_active` = 1 ORDER BY `c`.`display_order` ASC, `cur`.`year_level` ASC, `cur`.`semester` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `view_active_students_by_course`
--
DROP TABLE IF EXISTS `view_active_students_by_course`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_active_students_by_course`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`first_name` AS `first_name`, `s`.`last_name` AS `last_name`, `s`.`email` AS `email`, `c`.`course_code` AS `course_code`, `c`.`course_name` AS `course_name`, `s`.`year_level` AS `year_level`, `s`.`current_semester` AS `current_semester`, `s`.`current_academic_year` AS `current_academic_year`, `s`.`gpa` AS `gpa` FROM (`students` `s` join `courses` `c` on(`s`.`course_id` = `c`.`id`)) WHERE `s`.`status` = 'active' AND `s`.`is_account_active` = 1 ORDER BY `c`.`display_order` ASC, `s`.`last_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `view_pending_enrollees`
--
DROP TABLE IF EXISTS `view_pending_enrollees`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_pending_enrollees`  AS SELECT `e`.`id` AS `id`, `e`.`pre_reg_number` AS `pre_reg_number`, `e`.`first_name` AS `first_name`, `e`.`last_name` AS `last_name`, `e`.`email` AS `email`, `e`.`phone` AS `phone`, `c`.`course_code` AS `course_code`, `c`.`course_name` AS `course_name`, `e`.`year_level` AS `year_level`, `e`.`application_date` AS `application_date` FROM (`enrollees` `e` left join `courses` `c` on(`e`.`course_id` = `c`.`id`)) WHERE `e`.`status` = 'pre-registered' ORDER BY `e`.`application_date` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_logs_user` (`user_id`),
  ADD KEY `idx_activity_logs_created` (`created_at`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `course_code` (`course_code`);

--
-- Indexes for table `course_enrollment_schedule`
--
ALTER TABLE `course_enrollment_schedule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_course` (`course_id`),
  ADD KEY `idx_ces_course` (`course_id`);

--
-- Indexes for table `curriculum`
--
ALTER TABLE `curriculum`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subject` (`course_id`,`subject_code`,`year_level`,`semester`),
  ADD KEY `professor_id` (`professor_id`),
  ADD KEY `idx_curriculum_course` (`course_id`);

--
-- Indexes for table `enrollees`
--
ALTER TABLE `enrollees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pre_reg_number` (`pre_reg_number`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_enrollees_status` (`status`),
  ADD KEY `idx_enrollees_course` (`course_id`),
  ADD KEY `idx_enrollees_email` (`email`);

--
-- Indexes for table `enrollment_settings`
--
ALTER TABLE `enrollment_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `permission_modules`
--
ALTER TABLE `permission_modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `module_slug` (`module_slug`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_role_permission` (`role_id`,`permission_module_slug`,`action`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `pre_reg_number` (`pre_reg_number`),
  ADD KEY `idx_students_course` (`course_id`),
  ADD KEY `idx_students_status` (`status`),
  ADD KEY `idx_students_student_id` (`student_id`);

--
-- Indexes for table `student_curriculum_assignments`
--
ALTER TABLE `student_curriculum_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_student_curriculum` (`student_id`,`curriculum_id`),
  ADD KEY `curriculum_id` (`curriculum_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `student_enrolled_subjects`
--
ALTER TABLE `student_enrolled_subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_student_enrolled_subject` (`student_id`,`curriculum_id`),
  ADD KEY `idx_student_enrolled_student` (`student_id`),
  ADD KEY `idx_student_enrolled_curriculum` (`curriculum_id`),
  ADD KEY `idx_student_enrolled_offering` (`offering_id`);

--
-- Indexes for table `student_records_archive`
--
ALTER TABLE `student_records_archive`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_student_records_archive` (`student_pk`),
  ADD KEY `idx_records_archive_reason` (`archive_reason`),
  ADD KEY `idx_records_archive_archived_at` (`archived_at`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `subject_offerings`
--
ALTER TABLE `subject_offerings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_subject_offering` (`curriculum_id`,`course_id`,`year_level`,`semester`),
  ADD KEY `idx_subject_offerings_course_setup` (`course_id`,`year_level`,`semester`),
  ADD KEY `idx_subject_offerings_curriculum` (`curriculum_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `course_enrollment_schedule`
--
ALTER TABLE `course_enrollment_schedule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `curriculum`
--
ALTER TABLE `curriculum`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=234;

--
-- AUTO_INCREMENT for table `enrollees`
--
ALTER TABLE `enrollees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1111;

--
-- AUTO_INCREMENT for table `permission_modules`
--
ALTER TABLE `permission_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=610;

--
-- AUTO_INCREMENT for table `student_curriculum_assignments`
--
ALTER TABLE `student_curriculum_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `student_enrolled_subjects`
--
ALTER TABLE `student_enrolled_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=574;

--
-- AUTO_INCREMENT for table `student_records_archive`
--
ALTER TABLE `student_records_archive`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_offerings`
--
ALTER TABLE `subject_offerings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=226;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=616;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `course_enrollment_schedule`
--
ALTER TABLE `course_enrollment_schedule`
  ADD CONSTRAINT `course_enrollment_schedule_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `curriculum`
--
ALTER TABLE `curriculum`
  ADD CONSTRAINT `curriculum_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `curriculum_ibfk_2` FOREIGN KEY (`professor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `enrollees`
--
ALTER TABLE `enrollees`
  ADD CONSTRAINT `enrollees_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `enrollees_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  ADD CONSTRAINT `students_ibfk_2` FOREIGN KEY (`pre_reg_number`) REFERENCES `enrollees` (`pre_reg_number`) ON DELETE SET NULL;

--
-- Constraints for table `student_curriculum_assignments`
--
ALTER TABLE `student_curriculum_assignments`
  ADD CONSTRAINT `student_curriculum_assignments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_curriculum_assignments_ibfk_2` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_curriculum_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_records_archive`
--
ALTER TABLE `student_records_archive`
  ADD CONSTRAINT `student_records_archive_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
