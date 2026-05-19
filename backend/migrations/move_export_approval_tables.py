"""
Migration: Move export approval tables from market schema to consult schema
"""

from sqlalchemy import text
import sys
sys.path.insert(0, ".")

from app.core.database import engine

def migrate():
    """Move tables from market to consult schema"""
    with engine.connect() as conn:
        # Move the tables
        print("Moving tables from market to consult schema...")
        
        try:
            conn.execute(text('ALTER TABLE market."咨询量导出审批人" SET SCHEMA consult'))
            print("  - 咨询量导出审批人 moved")
        except Exception as e:
            print(f"  - 咨询量导出审批人 error: {e}")
        
        try:
            conn.execute(text('ALTER TABLE market."咨询量导出申请" SET SCHEMA consult'))
            print("  - 咨询量导出申请 moved")
        except Exception as e:
            print(f"  - 咨询量导出申请 error: {e}")
        
        conn.commit()
        print("Migration completed!")
        
        # Verify
        result = conn.execute(text("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name LIKE '%咨询量导出%'
        """))
        print("\nVerification:")
        for row in result:
            print(f"  schema={row[0]}, table={row[1]}")


if __name__ == "__main__":
    migrate()
