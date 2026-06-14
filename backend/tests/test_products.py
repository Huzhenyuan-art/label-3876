import pytest


class TestProducts:
    @pytest.mark.asyncio
    async def test_get_all_products(self, client, test_data):
        response = await client.get("/api/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) == 3

    @pytest.mark.asyncio
    async def test_get_products_by_category(self, client, test_data):
        categories = test_data["categories"]
        digital_category = categories[0]

        response = await client.get(
            "/api/products",
            params={"category_id": digital_category.id},
        )
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) == 2
        for p in products:
            assert p["category_id"] == digital_category.id

    @pytest.mark.asyncio
    async def test_get_products_by_category_clothing(self, client, test_data):
        categories = test_data["categories"]
        clothing_category = categories[1]

        response = await client.get(
            "/api/products",
            params={"category_id": clothing_category.id},
        )
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 1
        assert products[0]["name"] == "纯棉T恤"

    @pytest.mark.asyncio
    async def test_get_product_by_id_success(self, client, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.get(f"/api/products/{product.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product.id
        assert data["name"] == product.name
        assert data["price"] == product.price
        assert data["stock"] == product.stock
        assert "shop" in data
        assert "category" in data

    @pytest.mark.asyncio
    async def test_get_product_by_id_not_found(self, client, test_data):
        response = await client.get("/api/products/99999")
        assert response.status_code == 404
        assert "Product not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_product_has_specs(self, client, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.get(f"/api/products/{product.id}")
        assert response.status_code == 200
        data = response.json()
        assert "specs" in data
        assert data["specs"] is not None
        assert "颜色" in data["specs"]

    @pytest.mark.asyncio
    async def test_product_has_price_and_original_price(self, client, test_data):
        products = test_data["products"]
        product = products[0]

        response = await client.get(f"/api/products/{product.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["price"] == 299.0
        assert data["original_price"] == 599.0
        assert data["price"] < data["original_price"]


class TestCategories:
    @pytest.mark.asyncio
    async def test_get_all_categories(self, client, test_data):
        response = await client.get("/api/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) == 2

    @pytest.mark.asyncio
    async def test_get_category_by_id_success(self, client, test_data):
        categories = test_data["categories"]
        category = categories[0]

        response = await client.get(f"/api/categories/{category.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == category.id
        assert data["name"] == category.name

    @pytest.mark.asyncio
    async def test_get_category_by_id_not_found(self, client, test_data):
        response = await client.get("/api/categories/99999")
        assert response.status_code == 404


class TestShops:
    @pytest.mark.asyncio
    async def test_get_shop_by_id_success(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.get(f"/api/shops/{shop.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == shop.id
        assert data["name"] == shop.name
        assert "follower_count" in data

    @pytest.mark.asyncio
    async def test_get_shop_by_id_not_found(self, client, test_data):
        response = await client.get("/api/shops/99999")
        assert response.status_code == 404
        assert "Shop not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_shop_products(self, client, test_data):
        shops = test_data["shops"]
        shop1 = shops[0]

        response = await client.get(f"/api/shops/{shop1.id}/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) == 2
        for p in products:
            assert p["shop_id"] == shop1.id

    @pytest.mark.asyncio
    async def test_get_shop_products_empty(self, client, test_data):
        shops = test_data["shops"]
        shop2 = shops[1]

        response = await client.get(f"/api/shops/{shop2.id}/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) == 1
