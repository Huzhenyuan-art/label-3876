import requests
import json

BASE_URL = "http://localhost:8876/api"

def test_order_flow():
    print("=" * 60)
    print("1. 登录获取 Token")
    print("=" * 60)
    login_resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": "testuser", "password": "123456"}
    )
    print(f"登录状态码: {login_resp.status_code}")
    login_data = login_resp.json()
    token = login_data["access_token"]
    user = login_data["user"]
    print(f"用户: {user['username']} (ID: {user['id']})")
    print()

    headers = {"Authorization": f"Bearer {token}"}

    print("=" * 60)
    print("2. 创建订单")
    print("=" * 60)
    order_data = {
        "items": [
            {
                "product_id": 1,
                "product_name": "无线蓝牙耳机 Pro Max - 降噪版",
                "product_image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
                "price": 299.00,
                "quantity": 2,
                "specs": {"颜色": "星空黑", "版本": "降噪版"}
            },
            {
                "product_id": 2,
                "product_name": "智能手表 Ultra - 运动健康版",
                "product_image": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600",
                "price": 1299.00,
                "quantity": 1,
                "specs": {"颜色": "午夜黑", "表带": "运动表带"}
            }
        ],
        "shipping_address": "北京市朝阳区建国路88号SOHO现代城A座1801",
        "contact_name": "张三",
        "contact_phone": "13800138000",
        "payment_method": "支付宝",
        "shipping_method": "顺丰特快"
    }
    create_resp = requests.post(f"{BASE_URL}/orders", json=order_data, headers=headers)
    print(f"创建订单状态码: {create_resp.status_code}")
    created_order = create_resp.json()
    print(f"订单号: {created_order['order_no']}")
    print(f"订单ID: {created_order['id']}")
    print(f"订单状态: {created_order['status']}")
    print(f"订单总额: ¥{created_order['total_amount']}")
    print(f"商品数量: {len(created_order['items'])}")
    for item in created_order['items']:
        print(f"  - {item['product_name']} x{item['quantity']} = ¥{item['price'] * item['quantity']}")
    order_id = created_order['id']
    print()

    print("=" * 60)
    print("3. 获取订单列表")
    print("=" * 60)
    list_resp = requests.get(f"{BASE_URL}/orders", headers=headers)
    print(f"获取订单列表状态码: {list_resp.status_code}")
    orders = list_resp.json()
    print(f"订单总数: {len(orders)}")
    for order in orders:
        print(f"  - 订单号: {order['order_no']} | 状态: {order['status']} | 金额: ¥{order['total_amount']}")
    print()

    print("=" * 60)
    print("4. 获取订单详情")
    print("=" * 60)
    detail_resp = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    print(f"获取订单详情状态码: {detail_resp.status_code}")
    order_detail = detail_resp.json()
    print(f"订单号: {order_detail['order_no']}")
    print(f"订单状态: {order_detail['status']}")
    print(f"收货人: {order_detail['contact_name']}")
    print(f"联系电话: {order_detail['contact_phone']}")
    print(f"收货地址: {order_detail['shipping_address']}")
    print(f"支付方式: {order_detail['payment_method']}")
    print(f"配送方式: {order_detail['shipping_method']}")
    print(f"创建时间: {order_detail['created_at']}")
    print(f"更新时间: {order_detail['updated_at']}")
    print("商品明细:")
    for item in order_detail['items']:
        print(f"  - {item['product_name']}")
        print(f"    单价: ¥{item['price']} | 数量: {item['quantity']}")
        if item['specs']:
            print(f"    规格: {json.dumps(item['specs'], ensure_ascii=False)}")
    print()

    print("=" * 60)
    print("5. 取消订单")
    print("=" * 60)
    cancel_resp = requests.put(f"{BASE_URL}/orders/{order_id}/cancel", headers=headers)
    print(f"取消订单状态码: {cancel_resp.status_code}")
    cancelled_order = cancel_resp.json()
    print(f"订单状态: {cancelled_order['status']}")
    print(f"更新时间: {cancelled_order['updated_at']}")
    print()

    print("=" * 60)
    print("6. 验证取消后的订单状态")
    print("=" * 60)
    verify_resp = requests.get(f"{BASE_URL}/orders/{order_id}", headers=headers)
    verify_order = verify_resp.json()
    print(f"订单状态: {verify_order['status']}")
    assert verify_order['status'] == 'cancelled', "订单状态应该为 cancelled"
    print("✓ 订单取消验证通过！")
    print()

    print("=" * 60)
    print("所有订单 API 测试通过！✓")
    print("=" * 60)


if __name__ == "__main__":
    test_order_flow()
