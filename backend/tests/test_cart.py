import pytest


class TestCart:
    @pytest.mark.asyncio
    async def test_get_cart_empty(self, client, auth_headers, test_data):
        response = await client.get("/api/cart", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) == 0

    @pytest.mark.asyncio
    async def test_get_cart_no_auth(self, client, test_data):
        response = await client.get("/api/cart")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_add_cart_item_success(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={
                "product_id": product.id,
                "quantity": 2,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert item["product_id"] == product.id
        assert item["quantity"] == 2

    @pytest.mark.asyncio
    async def test_add_cart_item_with_specs(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={
                "product_id": product.id,
                "quantity": 1,
                "specs": {"颜色": "黑色", "版本": "标准版"},
            },
        )
        assert response.status_code == 201
        data = response.json()
        item = data["items"][0]
        assert item["specs"]["颜色"] == "黑色"
        assert item["specs"]["版本"] == "标准版"

    @pytest.mark.asyncio
    async def test_add_cart_item_increment_quantity(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": 2},
        )

        response = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": 3},
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 5

    @pytest.mark.asyncio
    async def test_add_cart_item_zero_quantity(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": 0},
        )
        assert response.status_code == 400
        assert "数量必须大于0" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_add_cart_item_negative_quantity(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": -1},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_add_cart_item_exceed_stock(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": product.stock + 1},
        )
        assert response.status_code == 400
        assert "库存不足" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_add_cart_item_nonexistent_product(self, client, auth_headers, test_data):
        response = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": 99999, "quantity": 1},
        )
        assert response.status_code == 404
        assert "商品不存在" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_add_cart_item_no_auth(self, client, test_data):
        response = await client.post(
            "/api/cart/items",
            json={"product_id": 1, "quantity": 1},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_cart_item_quantity(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        add_resp = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": 2},
        )
        item_id = add_resp.json()["items"][0]["id"]

        response = await client.put(
            f"/api/cart/items/{item_id}",
            headers=auth_headers,
            json={"quantity": 5},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["quantity"] == 5

    @pytest.mark.asyncio
    async def test_update_cart_item_zero_quantity(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        add_resp = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": 2},
        )
        item_id = add_resp.json()["items"][0]["id"]

        response = await client.put(
            f"/api/cart/items/{item_id}",
            headers=auth_headers,
            json={"quantity": 0},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_update_cart_item_not_found(self, client, auth_headers, test_data):
        response = await client.put(
            "/api/cart/items/99999",
            headers=auth_headers,
            json={"quantity": 1},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_remove_cart_item(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        add_resp = await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": 2},
        )
        item_id = add_resp.json()["items"][0]["id"]

        response = await client.delete(
            f"/api/cart/items/{item_id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0

    @pytest.mark.asyncio
    async def test_remove_cart_item_not_found(self, client, auth_headers, test_data):
        response = await client.delete(
            "/api/cart/items/99999",
            headers=auth_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_clear_cart(self, client, auth_headers, test_data):
        products = test_data["products"]

        await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": products[0].id, "quantity": 1},
        )
        await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": products[1].id, "quantity": 2},
        )

        response = await client.delete(
            "/api/cart/clear",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0

    @pytest.mark.asyncio
    async def test_clear_empty_cart(self, client, auth_headers, test_data):
        response = await client.delete(
            "/api/cart/clear",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0


class TestCartMerge:
    @pytest.mark.asyncio
    async def test_merge_cart_merge_strategy(self, client, auth_headers, test_data):
        products = test_data["products"]
        product = products[0]

        await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": product.id, "quantity": 2},
        )

        response = await client.post(
            "/api/cart/merge",
            headers=auth_headers,
            json={
                "items": [
                    {"product_id": product.id, "quantity": 3, "specs": None, "sku_id": None}
                ],
                "merge_strategy": "merge",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 5

    @pytest.mark.asyncio
    async def test_merge_cart_replace_strategy(self, client, auth_headers, test_data):
        products = test_data["products"]

        await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": products[0].id, "quantity": 2},
        )

        response = await client.post(
            "/api/cart/merge",
            headers=auth_headers,
            json={
                "items": [
                    {"product_id": products[1].id, "quantity": 1, "specs": None, "sku_id": None}
                ],
                "merge_strategy": "replace",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == products[1].id

    @pytest.mark.asyncio
    async def test_merge_cart_keep_server_strategy(self, client, auth_headers, test_data):
        products = test_data["products"]

        await client.post(
            "/api/cart/items",
            headers=auth_headers,
            json={"product_id": products[0].id, "quantity": 2},
        )

        response = await client.post(
            "/api/cart/merge",
            headers=auth_headers,
            json={
                "items": [
                    {"product_id": products[1].id, "quantity": 1, "specs": None, "sku_id": None}
                ],
                "merge_strategy": "keep_server",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == products[0].id

    @pytest.mark.asyncio
    async def test_merge_cart_with_invalid_product(self, client, auth_headers, test_data):
        products = test_data["products"]

        response = await client.post(
            "/api/cart/merge",
            headers=auth_headers,
            json={
                "items": [
                    {"product_id": 99999, "quantity": 1, "specs": None, "sku_id": None},
                    {"product_id": products[0].id, "quantity": 2, "specs": None, "sku_id": None},
                ],
                "merge_strategy": "merge",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == products[0].id
