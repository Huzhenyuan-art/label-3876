import pytest


class TestShopFollow:
    @pytest.mark.asyncio
    async def test_follow_shop_success(self, client, auth_headers, test_data):
        shops = test_data["shops"]
        shop = shops[0]
        initial_followers = shop.follower_count

        response = await client.post(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_following"] is True
        assert data["follower_count"] == initial_followers + 1

    @pytest.mark.asyncio
    async def test_follow_shop_twice_idempotent(self, client, auth_headers, test_data):
        shops = test_data["shops"]
        shop = shops[1]

        response1 = await client.post(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["is_following"] is True

        response2 = await client.post(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["is_following"] is True
        assert data2["follower_count"] == data1["follower_count"]

    @pytest.mark.asyncio
    async def test_follow_shop_no_auth(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.post(f"/api/shops/{shop.id}/follow")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_follow_nonexistent_shop(self, client, auth_headers, test_data):
        response = await client.post(
            "/api/shops/99999/follow",
            headers=auth_headers,
        )
        assert response.status_code == 404
        assert "店铺不存在" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_unfollow_shop_success(self, client, auth_headers, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        await client.post(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )

        response = await client.delete(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_following"] is False
        assert data["follower_count"] == shop.follower_count

    @pytest.mark.asyncio
    async def test_unfollow_shop_not_following(self, client, auth_headers, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.delete(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_following"] is False
        assert data["follower_count"] == shop.follower_count

    @pytest.mark.asyncio
    async def test_unfollow_shop_no_auth(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.delete(f"/api/shops/{shop.id}/follow")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_follow_status_following(self, client, auth_headers, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        await client.post(
            f"/api/shops/{shop.id}/follow",
            headers=auth_headers,
        )

        response = await client.get(
            f"/api/shops/{shop.id}/follow-status",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_following"] is True

    @pytest.mark.asyncio
    async def test_get_follow_status_not_following(self, client, auth_headers, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.get(
            f"/api/shops/{shop.id}/follow-status",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_following"] is False

    @pytest.mark.asyncio
    async def test_get_follow_status_no_auth_optional(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.get(f"/api/shops/{shop.id}/follow-status")
        assert response.status_code == 200
        data = response.json()
        assert data["is_following"] is False
        assert "follower_count" in data

    @pytest.mark.asyncio
    async def test_get_followed_shops_list(self, client, auth_headers, test_data):
        shops = test_data["shops"]

        await client.post(
            f"/api/shops/{shops[0].id}/follow",
            headers=auth_headers,
        )
        await client.post(
            f"/api/shops/{shops[1].id}/follow",
            headers=auth_headers,
        )

        response = await client.get(
            "/api/user/followed-shops",
            headers=auth_headers,
        )
        assert response.status_code == 200
        follows = response.json()
        assert isinstance(follows, list)
        assert len(follows) == 2

    @pytest.mark.asyncio
    async def test_get_followed_shops_empty(self, client, auth_headers, test_data):
        response = await client.get(
            "/api/user/followed-shops",
            headers=auth_headers,
        )
        assert response.status_code == 200
        follows = response.json()
        assert isinstance(follows, list)
        assert len(follows) == 0

    @pytest.mark.asyncio
    async def test_get_followed_shops_no_auth(self, client, test_data):
        response = await client.get("/api/user/followed-shops")
        assert response.status_code == 401
