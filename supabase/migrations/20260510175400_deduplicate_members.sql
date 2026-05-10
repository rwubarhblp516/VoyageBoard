-- 1. 清理 trip_members 中的重复数据
DELETE FROM trip_members a USING trip_members b
WHERE a.id > b.id
AND a.trip_id = b.trip_id
AND a.user_id = b.user_id;

-- 2. 添加唯一性约束，防止未来再次出现重复
ALTER TABLE trip_members ADD CONSTRAINT unique_trip_user UNIQUE (trip_id, user_id);
