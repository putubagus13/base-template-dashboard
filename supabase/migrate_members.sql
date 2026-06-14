-- ============================================================
-- MEMBER DATA MIGRATION
-- Source: supabase/members_rows.sql (old schema)
-- Target: members table (current Prisma schema)
-- Organization: a295b3fe-0e95-4ae3-8661-f9dbfa54d85f
--
-- Column mapping:
--   member_number  → "memberNumber"
--   full_name      → "fullName"
--   date_of_birth  → "dateOfBirth"
--   gender         → "gender"       ('L' → 'MALE', 'P' → 'FEMALE')
--   role           → "position"
--   activity_points→ "activityPoint"
--   status_id      → "statusId"
--   join_date      → "joinDate"
--   is_active      → "isActive"
--   photo_url      → "photoUrl"
--   rt_rw, nik, profile_id → DROPPED (not in current schema)
--   empty strings  → NULL (for nullable fields)
--   statusId       → NULL (old status type IDs don't exist in target org)
-- ============================================================

INSERT INTO "public"."members" (
  "id",
  "organizationId",
  "memberNumber",
  "fullName",
  "dateOfBirth",
  "gender",
  "address",
  "phone",
  "email",
  "statusId",
  "position",
  "joinDate",
  "isActive",
  "activityPoint",
  "photoUrl",
  "occupation",
  "notes",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
  "deletedAt"
)
VALUES
-- STT0016 | Ni Wayan santika | P | anggota | status: c9767bb7
('0c8cf091-c43e-4e42-8760-c73da9fac68c', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0016', 'Ni Wayan santika', NULL, 'FEMALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:47:15.130702+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0012 | Made Ratih Amelia Putri | P | anggota | status: c9767bb7
('111adec1-7ac5-4c4c-a425-d8284be30ee2', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0012', 'Made Ratih Amelia Putri', NULL, 'FEMALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:43:50.103967+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0011 | Gede chezkia resky adithi | P | anggota | status: c9767bb7
('31097882-644a-41c1-aebe-df9b5ec475d6', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0011', 'Gede chezkia resky adithi', NULL, 'FEMALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:43:26.303614+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0017 | Ketut Radit | L | anggota | status: c9767bb7
('3b0944b1-9258-4718-93b1-05ec521e649c', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0017', 'Ketut Radit', NULL, 'MALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:48:21.290494+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0019 | Wayan Riski Putra Galih | L | anggota | status: c9767bb7
('4c717f1c-6ff6-4736-a274-9a95c6b21527', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0019', 'Wayan Riski Putra Galih', NULL, 'MALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:50:01.04254+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0005 | Ketut Dika | L | anggota | status: 24c25bbc
('54b7b4eb-e24d-42ea-9424-c3aefd7ea676', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0005', 'Ketut Dika', NULL, 'MALE', NULL, NULL, NULL, NULL, 'anggota', '2020-01-01', true, 0, NULL, 'Mahasiswa', NULL, '2026-06-05 16:31:17.995742+00', '2026-06-06 15:02:28.278199+00', '2ee6d4c9-3119-4492-bb86-43648e01b20f', '2ee6d4c9-3119-4492-bb86-43648e01b20f', NULL),

-- STT0007 | Gerbi | L | anggota | status: c9767bb7
('6abc5673-4995-4bd9-ba57-a5c781d5f6af', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0007', 'Gerbi', NULL, 'MALE', NULL, NULL, NULL, NULL, 'anggota', '2026-01-01', true, 15, NULL, 'Mahasiswa', NULL, '2026-06-05 16:33:29.477672+00', '2026-06-06 15:02:28.278199+00', '2ee6d4c9-3119-4492-bb86-43648e01b20f', '2ee6d4c9-3119-4492-bb86-43648e01b20f', NULL),

-- STT0018 | Made Candra | L | anggota | status: c9767bb7
('7804e791-d1d6-427f-b54b-925f7c0f7265', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0018', 'Made Candra', NULL, 'MALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:49:43.841306+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0001 | Putu Bagus Raditya | L | ketua | status: 35695c95
('7ffb5089-9993-4893-b367-168b9784a247', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0001', 'Putu Bagus Raditya', '2000-01-01', 'MALE', NULL, NULL, NULL, NULL, 'ketua', '2026-06-01', true, 15, NULL, 'Pegawai Swasta', NULL, '2026-06-01 16:45:49.25829+00', '2026-06-06 15:02:28.278199+00', '2ee6d4c9-3119-4492-bb86-43648e01b20f', '2ee6d4c9-3119-4492-bb86-43648e01b20f', NULL),

-- STT0009 | kadek yoni | P | anggota | status: c9767bb7
('a81cb57a-1295-4ceb-b063-dc2c2f9e8dae', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0009', 'kadek yoni', NULL, 'FEMALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:42:26.879895+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0015 | Wayan Kerti | P | anggota | status: c9767bb7
('b084f99e-e5db-4485-ac30-5efd1fd04245', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0015', 'Wayan Kerti', NULL, 'FEMALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:46:57.982846+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0010 | Ni luh gede ayu dibia maheswari | P | anggota | status: c9767bb7
('b9ca302f-5493-4760-9d5b-47adf5a0f9e7', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0010', 'Ni luh gede ayu dibia maheswari', NULL, 'FEMALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:43:04.263305+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL),

-- STT0004 | Wayan Yase | L | anggota | status: 24c25bbc
('befaded8-d279-463e-b6c1-b371f152b9dc', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0004', 'Wayan Yase', NULL, 'MALE', NULL, NULL, NULL, NULL, 'anggota', '2020-01-01', true, 0, NULL, 'Mahasiswa', NULL, '2026-06-05 16:30:19.802577+00', '2026-06-06 15:02:28.278199+00', '2ee6d4c9-3119-4492-bb86-43648e01b20f', '2ee6d4c9-3119-4492-bb86-43648e01b20f', NULL),

-- STT0006 | I Putu Panji Saputra | L | anggota | status: c9767bb7 | phone: 085768363173
('c4bc8a5d-6811-4131-9965-68846cb8e776', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0006', 'I Putu Panji Saputra', '2004-01-04', 'MALE', NULL, '085768363173', NULL, NULL, 'anggota', '2020-01-01', true, 0, NULL, NULL, NULL, '2026-06-05 16:31:46.965692+00', '2026-06-06 15:02:28.278199+00', '2ee6d4c9-3119-4492-bb86-43648e01b20f', '2ee6d4c9-3119-4492-bb86-43648e01b20f', NULL),

-- STT0003 | Ketut Wahyu Pribadi | L | anggota | status: c9767bb7
('c612f820-21ad-445e-b2a3-b4e1a0fded6c', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0003', 'Ketut Wahyu Pribadi', NULL, 'MALE', NULL, NULL, NULL, NULL, 'anggota', '2020-01-01', true, 15, NULL, 'Pegawai Swasta', NULL, '2026-06-05 16:29:41.130399+00', '2026-06-06 15:02:28.278199+00', '2ee6d4c9-3119-4492-bb86-43648e01b20f', '2ee6d4c9-3119-4492-bb86-43648e01b20f', NULL),

-- SKIPPED: STT0013 | cb22aefa (soft-deleted in source data, deleted_at = 2026-06-06)

-- STT0008 | Komang Febri | L | anggota | status: c9767bb7
('d49d630e-c367-4daa-befd-5329bc4e08cd', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0008', 'Komang Febri', NULL, 'MALE', NULL, NULL, NULL, NULL, 'anggota', '2020-01-01', true, 15, NULL, 'Wiraswasta', NULL, '2026-06-05 16:34:37.223723+00', '2026-06-06 15:02:28.278199+00', '2ee6d4c9-3119-4492-bb86-43648e01b20f', '2ee6d4c9-3119-4492-bb86-43648e01b20f', NULL),

-- STT0002 | Gede Angkasa Duta Tangkas | L | wakil_ketua | status: 35695c95
('f3a4f6d9-dfc2-4865-90e2-7e1e9a0d3fbe', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0002', 'Gede Angkasa Duta Tangkas', NULL, 'MALE', NULL, NULL, NULL, NULL, 'wakil_ketua', '2020-09-07', true, 15, NULL, 'Wiraswasta', NULL, '2026-06-05 07:58:02.493538+00', '2026-06-06 15:02:28.278199+00', '2ee6d4c9-3119-4492-bb86-43648e01b20f', '2ee6d4c9-3119-4492-bb86-43648e01b20f', NULL),

-- STT0014 | Ayu komang virdiani | P | anggota | status: c9767bb7
('f47d5bfd-e064-45ad-925e-c6dc52b26a1e', 'a295b3fe-0e95-4ae3-8661-f9dbfa54d85f', 'STT0014', 'Ayu komang virdiani', NULL, 'FEMALE', NULL, NULL, NULL, NULL, 'anggota', '2026-06-06', true, 15, NULL, NULL, NULL, '2026-06-06 12:46:40.692244+00', '2026-06-06 15:02:28.278199+00', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', 'd1b3718c-0b2f-4dc6-9641-ebae743dfbe3', NULL)
ON CONFLICT (id) DO NOTHING;
