-- 创建压力面试表头配置表
-- 用于存储每个校区、班级、项目的表头配置（如"教员1评分"改为"张建新评分"）

CREATE TABLE IF NOT EXISTS academic.press_interview_header_configs (
    id SERIAL PRIMARY KEY,
    campus_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    project_number INTEGER NOT NULL,
    header_config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_header_config UNIQUE (campus_name, class_name, project_number)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_header_config_campus_class 
    ON academic.press_interview_header_configs(campus_name, class_name);

-- 添加注释
COMMENT ON TABLE academic.press_interview_header_configs IS '压力面试表头配置表';
COMMENT ON COLUMN academic.press_interview_header_configs.campus_name IS '校区名称';
COMMENT ON COLUMN academic.press_interview_header_configs.class_name IS '班级名称';
COMMENT ON COLUMN academic.press_interview_header_configs.project_number IS '项目编号';
COMMENT ON COLUMN academic.press_interview_header_configs.header_config IS '表头配置JSON，格式：{"instructor1": "张建新评分", "instructor2": "教员2评分", ...}';
