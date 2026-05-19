@echo off
chcp 65001 >nul
echo ========================================
echo 添加视频日度数据表缺失的字段
echo ========================================
echo.
echo 将要添加以下字段:
echo   - 优酷分享量 (INTEGER)
echo   - 优酷粉丝数 (INTEGER)
echo   - 爱奇艺总播放时长 (NUMERIC)
echo   - 爱奇艺总播放完成率 (NUMERIC)
echo.
echo 按任意键开始执行迁移...
pause >nul

cd /d "%~dp0.."
python migrations/add_video_missing_fields.py

echo.
echo ========================================
echo 迁移完成！
echo ========================================
echo.
pause

