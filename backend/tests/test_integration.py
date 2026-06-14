import pytest


class TestIntegrationCartToCheckout:
    @pytest.mark.asyncio
    async def test_full_cart_to_order_flow(self, client, auth_headers, test_data):
        products = test_data["products"]
        product1 = products[0]
        product2 = products[1]

        cart_resp1 = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={
                "product_id": product1.id,
                "quantity": 2,
                "specs": {"颜色": "黑色"},
            },
        )
        assert cart_resp1.status_code == 201
        cart_data = cart_resp1.json()
        assert len(cart_data["items"]) == 1
        assert cart_data["items"][0]["quantity"] == 2

        cart_resp2 = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={
                "product_id": product2.id,
                "quantity": 1,
                "specs": {"颜色": "银色"},
            },
        )
        assert cart_resp2.status_code == 201
        cart_data = cart_resp2.json()
        assert len(cart_data["items"]) == 2

        cart_resp = await client.get("/api/cart", headers=auth_headers)
        cart_data = cart_resp.json()
        assert len(cart_data["items"]) == 2

        order_items = []
        total_expected = 0
        for item in cart_data["items"]:
            product_resp = await client.get(f"/api/products/{item['product_id']}")
            product_info = product_resp.json()
            order_items.append({
                "product_id": item["product_id"],
                "product_name": product_info["name"],
                "product_image": product_info["main_image"],
                "price": product_info["price"],
                "quantity": item["quantity"],
                "specs": item["specs"],
            })
            total_expected += product_info["price"] * item["quantity"]

        order_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": order_items,
                "shipping_address": "北京市朝阳区建国路88号",
                "contact_name": "张三",
                "contact_phone": "13800138000",
                "payment_method": "支付宝",
                "shipping_method": "顺丰特快",
            },
        )
        assert order_resp.status_code == 201
        order_data = order_resp.json()
        assert order_data["status"] == "pending"
        assert order_data["total_amount"] == total_expected
        assert len(order_data["items"]) == 2

        pay_resp = await client.put(
            f"/api/orders/{order_data['id']}/pay",
            headers=auth_headers,
        )
        assert pay_resp.status_code == 200
        assert pay_resp.json()["status"] == "paid"

        ship_resp = await client.put(
            f"/api/orders/{order_data['id']}/ship",
            headers=auth_headers,
        )
        assert ship_resp.status_code == 200
        assert ship_resp.json()["status"] == "shipped"

        receive_resp = await client.put(
            f"/api/orders/{order_data['id']}/receive",
            headers=auth_headers,
        )
        assert receive_resp.status_code == 200
        assert receive_resp.json()["status"] == "delivered"

        complete_resp = await client.put(
            f"/api/orders/{order_data['id']}/complete",
            headers=auth_headers,
        )
        assert complete_resp.status_code == 200
        assert complete_resp.json()["status"] == "completed"

        detail_resp = await client.get(
            f"/api/orders/{order_data['id']}",
            headers=auth_headers,
        )
        final_order = detail_resp.json()
        assert final_order["status"] == "completed"
        assert final_order["total_amount"] == total_expected

    @pytest.mark.asyncio
    async def test_cart_persistence_across_requests(self, client, auth_headers, test_data):
        products = test_data["products"]

        await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": products[0].id, "quantity": 3},
        )

        cart_resp1 = await client.get("/api/cart", headers=auth_headers)
        cart1 = cart_resp1.json()
        assert len(cart1["items"]) == 1
        item_id = cart1["items"][0]["id"]

        await client.put(
            f"/api/cart/items/{item_id}",
            headers=auth_headers,
            json={"quantity": 5},
        )

        cart_resp2 = await client.get("/api/cart", headers=auth_headers)
        cart2 = cart_resp2.json()
        assert cart2["items"][0]["quantity"] == 5

        await client.delete(
            f"/api/cart/items/{item_id}",
            headers=auth_headers,
        )

        cart_resp3 = await client.get("/api/cart", headers=auth_headers)
        cart3 = cart_resp3.json()
        assert len(cart3["items"]) == 0

    @pytest.mark.asyncio
    async def test_multiple_orders_are_isolated(self, client, auth_headers, test_data):
        products = test_data["products"]

        order1_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [{
                    "product_id": products[0].id,
                    "product_name": products[0].name,
                    "price": products[0].price,
                    "quantity": 1,
                }],
            },
        )
        order1 = order1_resp.json()

        order2_resp = await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [{
                    "product_id": products[1].id,
                    "product_name": products[1].name,
                    "price": products[1].price,
                    "quantity": 2,
                }],
            },
        )
        order2 = order2_resp.json()

        assert order1["id"] != order2["id"]
        assert order1["order_no"] != order2["order_no"]
        assert order1["items"][0]["product_name"] == products[0].name
        assert order2["items"][0]["product_name"] == products[1].name

        orders_resp = await client.get("/api/orders", headers=auth_headers)
        orders = orders_resp.json()
        assert len(orders) == 2


class TestIntegrationShopFollowAndRefresh:
    @pytest.mark.asyncio
    async def test_follow_status_persists_after_refresh(self, client, auth_headers, test_data):
        shops = test_data["shops"]
        shop = shops[0]
        initial_followers = shop.follower_count

        status_resp1 = await client.get(
            f"/api/shops/{shop.id}/follow-status",
            headers=auth_headers,
        )
        status1 = status_resp1.json()
        assert status1["is_following"] is False
        assert status1["follower_count"] == initial_followers

        follow_resp = await client.post(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )
        follow_data = follow_resp.json()
        assert follow_data["is_following"] is True
        assert follow_data["follower_count"] == initial_followers + 1

        status_resp2 = await client.get(
            f"/api/shops/{shop.id}/follow-status",
            headers=auth_headers,
        )
        status2 = status_resp2.json()
        assert status2["is_following"] is True
        assert status2["follower_count"] == initial_followers + 1

        shop_resp = await client.get(f"/api/shops/{shop.id}")
        shop_data = shop_resp.json()
        assert shop_data["follower_count"] == initial_followers + 1

    @pytest.mark.asyncio
    async def test_unfollow_status_persists_after_refresh(self, client, auth_headers, test_data):
        shops = test_data["shops"]
        shop = shops[1]
        initial_followers = shop.follower_count

        await client.post(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )

        status_resp1 = await client.get(
            f"/api/shops/{shop.id}/follow-status",
            headers=auth_headers,
        )
        assert status_resp1.json()["is_following"] is True

        unfollow_resp = await client.delete(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )
        assert unfollow_resp.json()["is_following"] is False

        status_resp2 = await client.get(
            f"/api/shops/{shop.id}/follow-status",
            headers=auth_headers,
        )
        status2 = status_resp2.json()
        assert status2["is_following"] is False
        assert status2["follower_count"] == initial_followers

    @pytest.mark.asyncio
    async def test_followed_shops_list_updated(self, client, auth_headers, test_data):
        shops = test_data["shops"]

        followed_resp1 = await client.get(
            "/api/user/followed-shops",
            headers=auth_headers,
        )
        assert len(followed_resp1.json()) == 0

        await client.post(
            f"/api/shops/{shops[0].id}/follow",
            headers=auth_headers,
        )

        followed_resp2 = await client.get(
            "/api/user/followed-shops",
            headers=auth_headers,
        )
        follows2 = followed_resp2.json()
        assert len(follows2) == 1
        assert follows2[0]["shop_id"] == shops[0].id
        assert follows2[0]["shop"]["name"] == shops[0].name

        await client.post(
            f"/api/shops/{shops[1].id}/follow",
            headers=auth_headers,
        )

        followed_resp3 = await client.get(
            "/api/user/followed-shops",
            headers=auth_headers,
        )
        follows3 = followed_resp3.json()
        assert len(follows3) == 2

        await client.delete(
            f"/api/shops/{shops[0].id}/follow",
            headers=auth_headers,
        )

        followed_resp4 = await client.get(
            "/api/user/followed-shops",
            headers=auth_headers,
        )
        follows4 = followed_resp4.json()
        assert len(follows4) == 1
        assert follows4[0]["shop_id"] == shops[1].id


class TestIntegrationChatAndShop:
    @pytest.mark.asyncio
    async def test_chat_message_flow_with_shop(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        shop_resp = await client.get(f"/api/shops/{shop.id}")
        assert shop_resp.status_code == 200
        shop_data = shop_resp.json()
        assert shop_data["name"] == shop.name

        chat_resp1 = await client.get(f"/api/chat/{shop.id}")
        assert len(chat_resp1.json()) == 0

        msg1_resp = await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "请问这款耳机支持降噪吗？", "sender": "buyer"},
        )
        assert msg1_resp.status_code == 200

        msg2_resp = await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "您好，支持主动降噪的", "sender": "seller"},
        )
        assert msg2_resp.status_code == 200

        chat_resp2 = await client.get(f"/api/chat/{shop.id}")
        messages = chat_resp2.json()
        assert len(messages) == 2
        assert messages[0]["sender"] == "buyer"
        assert messages[1]["sender"] == "seller"
        assert messages[0]["content"] == "请问这款耳机支持降噪吗？"
        assert messages[1]["content"] == "您好，支持主动降噪的"

    @pytest.mark.asyncio
    async def test_chat_isolated_between_shops(self, client, test_data):
        shops = test_data["shops"]

        await client.post(
            f"/api/chat/{shops[0].id}",
            json={"content": "店铺1的消息", "sender": "buyer"},
        )

        await client.post(
            f"/api/chat/{shops[1].id}",
            json={"content": "店铺2的消息", "sender": "seller"},
        )

        chat1_resp = await client.get(f"/api/chat/{shops[0].id}")
        chat1 = chat1_resp.json()
        assert len(chat1) == 1
        assert chat1[0]["content"] == "店铺1的消息"

        chat2_resp = await client.get(f"/api/chat/{shops[1].id}")
        chat2 = chat2_resp.json()
        assert len(chat2) == 1
        assert chat2[0]["content"] == "店铺2的消息"


class TestIntegrationUserProfile:
    @pytest.mark.asyncio
    async def test_user_profile_update_and_refresh(self, client, auth_headers, test_data):
        me_resp1 = await client.get("/api/auth/me", headers=auth_headers)
        user1 = me_resp1.json()
        assert user1["nickname"] == "测试用户"

        update_resp = await client.put(
            "/api/auth/me",
            headers=auth_headers,
            json={"nickname": "新昵称123", "email": "newmail@example.com"},
        )
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert updated["nickname"] == "新昵称123"
        assert updated["email"] == "newmail@example.com"

        me_resp2 = await client.get("/api/auth/me", headers=auth_headers)
        user2 = me_resp2.json()
        assert user2["nickname"] == "新昵称123"
        assert user2["email"] == "newmail@example.com"
        assert user2["id"] == user1["id"]
