"""create monthly edit report table

Revision ID: monthly_edit_001
Revises: 
Create Date: 2026-01-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'monthly_edit_001'
down_revision = None  # Update this to the latest revision if needed
branch_labels = None
depends_on = None


def upgrade():
    # Create the monthly edit report table in market schema
    op.execute("""
        CREATE TABLE IF NOT EXISTS market.市场部剪辑月度汇报表 (
            id SERIAL PRIMARY KEY,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            row_type VARCHAR(20) NOT NULL,
            period VARCHAR(20) NOT NULL,
            period_label VARCHAR(20),
            campus VARCHAR(50),
            audience_type_count VARCHAR(100),
            planned_articles INTEGER DEFAULT 0,
            actual_articles INTEGER DEFAULT 0,
            planned_edit_demand INTEGER DEFAULT 0,
            completed_edit_demand INTEGER DEFAULT 0,
            actual_shoot_videos INTEGER DEFAULT 0,
            shoot_completion_progress VARCHAR(20),
            monthly_edit_plans INTEGER DEFAULT 0,
            completed_early_plans INTEGER DEFAULT 0,
            actual_edited_videos INTEGER DEFAULT 0,
            edit_progress_rate VARCHAR(20),
            audit_pass_video_count INTEGER DEFAULT 0,
            audit_pass_rate VARCHAR(20),
            group_activity TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_剪辑月度_年月 ON market.市场部剪辑月度汇报表 (year, month);
        
        COMMENT ON TABLE market.市场部剪辑月度汇报表 IS '市场部剪辑月度汇报表';
        COMMENT ON COLUMN market.市场部剪辑月度汇报表.row_type IS '行类型: summary合计/data神殿';
        COMMENT ON COLUMN market.市场部剪辑月度汇报表.period IS 'period标识: all-year 或 1-12';
        COMMENT ON COLUMN market.市场部剪辑月度汇报表.period_label IS 'period名称: 全年度 或 1月';
        COMMENT ON COLUMN market.市场部剪辑月度汇报表.campus IS '神殿名称，合计行则为"合计"';
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS market.市场部剪辑月度汇报表;")
