@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0.."

echo [INFO] ShieldPlate 一键启动脚本
echo.

if not exist .env (
    echo [WARN] .env 文件不存在，从 .env.development 复制...
    copy .env.development .env >nul
    echo [INFO] .env 已创建（开发环境配置）
)

echo [INFO] 构建 Docker 镜像...
docker compose build
if errorlevel 1 (
    echo [ERROR] Docker 构建失败
    exit /b 1
)

echo [INFO] 启动所有服务...
docker compose up -d
if errorlevel 1 (
    echo [ERROR] Docker 启动失败
    exit /b 1
)

echo [INFO] 等待服务就绪...
set MAX_WAIT=120
set ELAPSED=0

:wait_loop
if !ELAPSED! geq %MAX_WAIT% (
    echo [ERROR] 服务启动超时
    docker compose ps
    exit /b 1
)

set ALL_HEALTHY=1
for %%S in (db redis api web) do (
    docker compose ps %%S 2>nul | findstr "healthy" >nul 2>&1
    if errorlevel 1 (
        set ALL_HEALTHY=0
    )
)

if "!ALL_HEALTHY!"=="1" (
    echo [INFO] 所有服务已就绪！
    goto :verify
)

echo [INFO] 等待服务就绪... (!ELAPSED!s/%MAX_WAIT%s)
timeout /t 5 /nobreak >nul
set /a ELAPSED+=5
goto wait_loop

:verify
echo.
echo [INFO] 验证端口联通性...

echo [INFO]   验证 API 服务 (localhost:8876)...
curl -s -o nul -w "" http://localhost:8876/health 2>nul
if not errorlevel 1 (
    echo [INFO]   [OK] API 服务联通
) else (
    echo [ERROR]   [FAIL] API 服务不通
)

echo [INFO]   验证前端服务 (localhost:3876)...
curl -s -o nul -w "" http://localhost:3876/ 2>nul
if not errorlevel 1 (
    echo [INFO]   [OK] 前端服务联通
) else (
    echo [ERROR]   [FAIL] 前端服务不通
)

echo.
echo [INFO] 验证 API 健康检查...
curl -s http://localhost:8876/health 2>nul

echo.
echo.
echo [INFO] 验证商品列表...
curl -s http://localhost:8876/api/products 2>nul | findstr /c:"name" >nul 2>&1
if not errorlevel 1 (
    echo [INFO]   [OK] 商品列表正常
) else (
    echo [WARN]   商品列表可能为空
)

echo.
echo ==========================================
echo [INFO] 启动完成！
echo.
echo   前端:  http://localhost:3876
echo   API:   http://localhost:8876
echo   健康检查: http://localhost:8876/health
echo   数据库: localhost:5876
echo   Redis:  localhost:6876
echo ==========================================
