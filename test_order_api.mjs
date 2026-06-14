import axios from 'axios';

const BASE_URL = "http://localhost:8876/api";

async function testOrderFlow() {
    console.log("=".repeat(60));
    console.log("1. 登录获取 Token");
    console.log("=".repeat(60));
    const loginResp = await axios.post(`${BASE_URL}/auth/login`, {
        username: "testuser",
        password: "123456"
    });
    const token = loginResp.data.access_token;
    const user = loginResp.data.user;
    console.log(`用户: ${user.username} (ID: ${user.id})`);
    console.log();

    const headers = { Authorization: `Bearer ${token}` };

    console.log("=".repeat(60));
    console.log("2. 创建订单");
    console.log("=".repeat(60));
    const orderData = {
        items: [
            {
                product_id: 1,
                product_name: "无线蓝牙耳机 Pro Max - 降噪版",
                product_image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
                price: 299.00,
                quantity: 2,
                specs: { "颜色": "星空黑", "版本": "降噪版" }
            },
            {
                product_id: 2,
                product_name: "智能手表 Ultra - 运动健康版",
                product_image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600",
                price: 1299.00,
                quantity: 1,
                specs: { "颜色": "午夜黑", "表带": "运动表带" }
            }
        ],
        shipping_address: "北京市朝阳区建国路88号SOHO现代城A座1801",
        contact_name: "张三",
        contact_phone: "13800138000",
        payment_method: "支付宝",
        shipping_method: "顺丰特快"
    };
    const createResp = await axios.post(`${BASE_URL}/orders`, orderData, { headers });
    const createdOrder = createResp.data;
    console.log(`订单号: ${createdOrder.order_no}`);
    console.log(`订单ID: ${createdOrder.id}`);
    console.log(`订单状态: ${createdOrder.status}`);
    console.log(`订单总额: ¥${createdOrder.total_amount}`);
    console.log(`商品数量: ${createdOrder.items.length}`);
    for (const item of createdOrder.items) {
        console.log(`  - ${item.product_name} x${item.quantity} = ¥${item.price * item.quantity}`);
    }
    const orderId = createdOrder.id;
    console.log();

    console.log("=".repeat(60));
    console.log("3. 获取订单列表");
    console.log("=".repeat(60));
    const listResp = await axios.get(`${BASE_URL}/orders`, { headers });
    const orders = listResp.data;
    console.log(`订单总数: ${orders.length}`);
    for (const order of orders) {
        console.log(`  - 订单号: ${order.order_no} | 状态: ${order.status} | 金额: ¥${order.total_amount}`);
    }
    console.log();

    console.log("=".repeat(60));
    console.log("4. 获取订单详情");
    console.log("=".repeat(60));
    const detailResp = await axios.get(`${BASE_URL}/orders/${orderId}`, { headers });
    const orderDetail = detailResp.data;
    console.log(`订单号: ${orderDetail.order_no}`);
    console.log(`订单状态: ${orderDetail.status}`);
    console.log(`收货人: ${orderDetail.contact_name}`);
    console.log(`联系电话: ${orderDetail.contact_phone}`);
    console.log(`收货地址: ${orderDetail.shipping_address}`);
    console.log(`支付方式: ${orderDetail.payment_method}`);
    console.log(`配送方式: ${orderDetail.shipping_method}`);
    console.log(`创建时间: ${orderDetail.created_at}`);
    console.log(`更新时间: ${orderDetail.updated_at}`);
    console.log("商品明细:");
    for (const item of orderDetail.items) {
        console.log(`  - ${item.product_name}`);
        console.log(`    单价: ¥${item.price} | 数量: ${item.quantity}`);
        if (item.specs) {
            console.log(`    规格: ${JSON.stringify(item.specs)}`);
        }
    }
    console.log();

    console.log("=".repeat(60));
    console.log("5. 取消订单");
    console.log("=".repeat(60));
    const cancelResp = await axios.put(`${BASE_URL}/orders/${orderId}/cancel`, {}, { headers });
    const cancelledOrder = cancelResp.data;
    console.log(`订单状态: ${cancelledOrder.status}`);
    console.log(`更新时间: ${cancelledOrder.updated_at}`);
    console.log();

    console.log("=".repeat(60));
    console.log("6. 验证取消后的订单状态");
    console.log("=".repeat(60));
    const verifyResp = await axios.get(`${BASE_URL}/orders/${orderId}`, { headers });
    const verifyOrder = verifyResp.data;
    console.log(`订单状态: ${verifyOrder.status}`);
    if (verifyOrder.status !== 'cancelled') {
        throw new Error("订单状态应该为 cancelled");
    }
    console.log("✓ 订单取消验证通过！");
    console.log();

    console.log("=".repeat(60));
    console.log("所有订单 API 测试通过！✓");
    console.log("=".repeat(60));
}

testOrderFlow().catch(err => {
    console.error("测试失败:", err.response?.data || err.message);
    process.exit(1);
});
