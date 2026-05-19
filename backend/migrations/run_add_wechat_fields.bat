@echo off
echo ============================================================
echo 添加微信平台表缺失字段
echo ============================================================

cd /d D:\Documents\Desktop\1\qm-system\backend

REM 尝试使用不同的Python命令
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo 使用 python 命令...
    python migrations\add_wechat_missing_fields.py
    goto :end
)

where py >nul 2>&1
if %errorlevel% equ 0 (
    echo 使用 py 命令...
    py migrations\add_wechat_missing_fields.py
    goto :end
)

where python3 >nul 2>&1
if %errorlevel% equ 0 (
    echo 使用 python3 命令...
    python3 migrations\add_wechat_missing_fields.py
    goto :end
)

REM 尝试使用Anaconda路径
if exist "D:\Anaconda\python.exe" (
    echo 使用 Anaconda Python...
    D:\Anaconda\python.exe migrations\add_wechat_missing_fields.py
    goto :end
)

if exist "D:\Anaconda\envs\py311\python.exe" (
    echo 使用 Anaconda py311 环境...
    D:\Anaconda\envs\py311\python.exe migrations\add_wechat_missing_fields.py
    goto :end
)

echo 错误: 找不到Python解释器
echo 请手动运行: python migrations\add_wechat_missing_fields.py
pause
exit /b 1

:end
echo.
echo ============================================================
echo 完成！
echo ============================================================
pause

