import pytest


class TestOrders:
    @pytest.mark.asyncio
    async def test_create_order_success(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": product.id,
                        "product_name": product.name,
                        "product_image": product.main_image,
                        "price": product.price,
                        "quantity": 2,
                        "specs": {"颜色": "黑色"},
                    }
                ],
                "shipping_address": "北京市朝阳区",
                "contact_name": "张三",
                "contact_phone": "13800138000",
                "payment_method": "支付宝",
                "shipping_method": "顺丰快递",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "pending"
        assert data["total_amount"] == product.price * 2
        assert data["shipping_address"] == "北京市朝阳区"
        assert data["contact_name"] == "张三"
        assert len(data["items"]) == 1
        assert data["items"][0]["product_name"] == product.name
        assert data["items"][0]["quantity"] == 2
        assert data["order_no"].startswith("ORD-")

    @pytest.mark.asyncio
    async def test_create_order_multiple_items(self, client, auth_headers, test_data):
        products = test_data["products"]

        response = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 2,
                    },
                    {
                        "product_id": products[1].id,
                        "product_name": products[1].name,
                        "price": products[1].price,
                        "quantity": 1,
                    },
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        expected_total = products[0].price * 2 + products[1].price * 1
        assert data["total_amount"] == expected_total
        assert len(data["items"]) == 2

    @pytest.mark.asyncio
    async def test_create_order_empty_items(self, client, auth_headers, test_data):
        response = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={"items": []},
        )
        assert response.status_code == 400
        assert "订单商品不能为空" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_order_no_auth(self, client, test_data):
        response = await client.post(
            "/api/orders",
            json={"items": [{"product_id": 1, "product_name": "test", "price": 10, "quantity": 1}]},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_my_orders_empty(self, client, auth_headers, test_data):
        response = await client.get("/api/orders", headers=auth_headers)
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        assert len(orders) == 0

    @pytest.mark.asyncio
    async def test_get_my_orders(self, client, auth_headers, test_data):
        products = test_data["products"]

        await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[1].id,
                        "product_name": products[1].name,
                        "price": products[1].price,
                        "quantity": 2,
                    }
                ],
            },
        )

        response = await client.get("/api/orders", headers=auth_headers)
        assert response.status_code == 200
        orders = response.json()
        assert len(orders) == 2

    @pytest.mark.asyncio
    async def test_get_order_detail_success(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "product_image": products[0].main_image,
                        "price": products[0].price,
                        "quantity": 1,
                        "specs": {"颜色": "黑色"},
                    }
                ],
                "shipping_address": "测试地址",
                "contact_name": "测试用户",
                "contact_phone": "1234567890",
            },
        )
        order_id = create_resp.json()["id"]

        response = await client.get(
            f"/api/orders/{order_id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert data["status"] == "pending"
        assert data["shipping_address"] == "测试地址"
        assert data["contact_name"] == "测试用户"
        assert len(data["items"]) == 1

    @pytest.mark.asyncio
    async def test_get_order_detail_not_found(self, client, auth_headers, test_data):
        response = await client.get(
            "/api/orders/99999",
            headers=auth_headers,
        )
        assert response.status_code == 404
        assert "订单不存在" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_order_detail_no_auth(self, client, test_data):
        response = await client.get("/api/orders/1")
        assert response.status_code == 401


class TestOrderStatusFlow:
    @pytest.mark.asyncio
    async def test_pay_order_success(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        order_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/orders/{order_id}/pay",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paid"

    @pytest.mark.asyncio
    async def test_pay_order_already_paid(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        order_id = create_resp.json()["id"]

        await client.put(
            f"/api/orders/{order_id}/pay",
            headers=auth_headers,
        )

        response = await client.put(
            f"/api/orders/{order_id}/pay",
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "不允许支付" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_ship_order_success(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        order_id = create_resp.json()["id"]

        await client.put(f"/api/orders/{order_id}/pay", headers=auth_headers)

        response = await client.put(
            f"/api/orders/{order_id}/ship",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "shipped"

    @pytest.mark.asyncio
    async def test_ship_order_not_paid(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        order_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/orders/{order_id}/ship",
            headers=auth_headers,
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_receive_order_success(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        order_id = create_resp.json()["id"]

        await client.put(f"/api/orders/{order_id}/pay", headers=auth_headers)
        await client.put(f"/api/orders/{order_id}/ship", headers=auth_headers)

        response = await client.put(
            f"/api/orders/{order_id}/receive",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "delivered"

    @pytest.mark.asyncio
    async def test_complete_order_success(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        order_id = create_resp.json()["id"]

        await client.put(f"/api/orders/{order_id}/pay", headers=auth_headers)
        await client.put(f"/api/orders/{order_id}/ship", headers=auth_headers)
        await client.put(f"/api/orders/{order_id}/receive", headers=auth_headers)

        response = await client.put(
            f"/api/orders/{order_id}/complete",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"

    @pytest.mark.asyncio
    async def test_cancel_order_success(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        order_id = create_resp.json()["id"]

        response = await client.put(
            f"/api/orders/{order_id}/cancel",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cancelled"

    @pytest.mark.asyncio
    async def test_cancel_already_cancelled_order(self, client, auth_headers, test_data):
        products = test_data["products"]

        create_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [
                    {
                        "product_id": products[0].id,
                        "product_name": products[0].name,
                        "price": products[0].price,
                        "quantity": 1,
                    }
                ],
            },
        )
        order_id = create_resp.json()["id"]

        await client.put(f"/api/orders/{order_id}/cancel", headers=auth_headers)

        response = await client.put(
            f"/api/orders/{order_id}/cancel",
            headers=auth_headers,
        )
        assert response.status_code == 400
