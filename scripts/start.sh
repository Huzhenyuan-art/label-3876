#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
    log_warn ".env 文件不存在，从 .env.development 复制..."
    cp .env.development .env
    log_info ".env 已创建（开发环境配置）"
fi

log_info "构建 Docker 镜像..."
docker compose build

log_info "启动所有服务..."
docker compose up -d

log_info "等待服务就绪..."
MAX_WAIT=120
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    ALL_HEALTHY=true
    for SERVICE in db redis api web; do
        HEALTH=$(docker compose ps --format json 2>/dev/null | \
            python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        d = json.loads(line)
        if d.get('Service') == '$SERVICE':
            print(d.get('Health', 'unknown'))
            break
    except: pass
else:
    print('not_found')
" 2>/dev/null || echo "unknown")
        if [ "$HEALTH" != "healthy" ]; then
            ALL_HEALTHY=false
            break
        fi
    done

    if [ "$ALL_HEALTHY" = true ]; then
        log_info "所有服务已就绪！"
        break
    fi

    log_info "等待服务就绪... (${ELAPSED}s/${MAX_WAIT}s)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    log_error "服务启动超时，请检查日志：docker compose logs"
    docker compose ps
    exit 1
fi

log_info "验证端口联通性..."

check_port() {
    local host=$1 port=$2 name=$3
    if curl -s -o /dev/null -w "" "http://${host}:${port}/" 2>/dev/null || \
       curl -s -o /dev/null "http://${host}:${port}/health" 2>/dev/null; then
        log_info "  [✓] ${name} (http://${host}:${port}) 联通"
        return 0
    else
        log_error "  [✗] ${name} (http://${host}:${port}) 不通"
        return 1
    fi
}

FAILED=0
check_port localhost 8876 "API 服务" || FAILED=$((FAILED + 1))
check_port localhost 3876 "前端服务" || FAILED=$((FAILED + 1))

log_info "验证 API 健康检查..."
API_HEALTH=$(curl -s http://localhost:8876/health)
echo "  响应: $API_HEALTH"

API_STATUS=$(echo "$API_HEALTH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('status', 'unknown'))
" 2>/dev/null || echo "parse_error")

if [ "$API_STATUS" = "healthy" ] || [ "$API_STATUS" = "degraded" ]; then
    log_info "  [✓] API 健康状态: $API_STATUS"
else
    log_error "  [✗] API 健康状态异常: $API_STATUS"
    FAILED=$((FAILED + 1))
fi

log_info "验证主流程 - 用户注册/登录..."
REGISTER_RESP=$(curl -s -X POST http://localhost:8876/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"smoketest","email":"smoketest@test.com","password":"smoketest123"}' 2>/dev/null || echo '{}')

LOGIN_RESP=$(curl -s -X POST http://localhost:8876/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"smoketest","password":"smoketest123"}' 2>/dev/null || echo '{}')

TOKEN=$(echo "$LOGIN_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('access_token', ''))
" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
    log_info "  [✓] 用户登录成功，获取到 Token"
else
    log_warn "  [!] 用户登录未获取到 Token（可能用户已存在）"
fi

log_info "验证主流程 - 商品列表..."
PRODUCTS_RESP=$(curl -s http://localhost:8876/api/products 2>/dev/null || echo '[]')
PRODUCT_COUNT=$(echo "$PRODUCTS_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(len(d) if isinstance(d, list) else 0)
" 2>/dev/null || echo "0")

if [ "$PRODUCT_COUNT" -gt 0 ]; then
    log_info "  [✓] 商品列表返回 ${PRODUCT_COUNT} 个商品"
else
    log_warn "  [!] 商品列表为空（可能需要运行 seed）"
fi

log_info "验证前端页面..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3876/ 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    log_info "  [✓] 前端页面可访问 (HTTP 200)"
else
    log_error "  [✗] 前端页面不可访问 (HTTP ${FRONTEND_STATUS})"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "=========================================="
if [ $FAILED -eq 0 ]; then
    log_info "所有验证通过！服务已就绪。"
    echo ""
    log_info "访问地址："
    echo "  前端:  http://localhost:3876"
    echo "  API:   http://localhost:8876"
    echo "  健康检查: http://localhost:8876/health"
    echo "  数据库: localhost:5876"
    echo "  Redis:  localhost:6876"
else
    log_error "${FAILED} 项验证失败，请检查服务状态。"
    exit 1
fi
