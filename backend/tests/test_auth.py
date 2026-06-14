import pytest


class TestAuthRegister:
    @pytest.mark.asyncio
    async def test_register_success(self, client):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "password123",
                "nickname": "新用户",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "newuser"
        assert data["user"]["email"] == "new@example.com"
        assert data["user"]["nickname"] == "新用户"
        assert "id" in data["user"]

    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, client, test_data):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "another@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 400
        assert "用户名已被注册" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client, test_data):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "anotheruser",
                "email": "test@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 400
        assert "邮箱已被注册" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "testuser2",
                "email": "invalid-email",
                "password": "password123",
            },
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_empty_username(self, client):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "",
                "email": "test@example.com",
                "password": "password123",
            },
        )
        assert response.status_code >= 400

    @pytest.mark.asyncio
    async def test_register_default_nickname(self, client):
        response = await client.post(
            "/api/auth/register",
            json={
                "username": "user_without_nick",
                "email": "nonick@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["nickname"] == "USER_WITHOUT_NICK"


class TestAuthLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, client, test_data):
        response = await client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "test123456"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "testuser"
        assert data["user"]["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, test_data):
        response = await client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "用户名或密码错误" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_wrong_username(self, client, test_data):
        response = await client.post(
            "/api/auth/login",
            json={"username": "nonexistent", "password": "test123456"},
        )
        assert response.status_code == 401
        assert "用户名或密码错误" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_login_empty_credentials(self, client):
        response = await client.post(
            "/api/auth/login",
            json={"username": "", "password": ""},
        )
        assert response.status_code == 401


class TestAuthMe:
    @pytest.mark.asyncio
    async def test_get_current_user_success(self, client, auth_headers, test_data):
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "avatar" in data
        assert "nickname" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_get_current_user_no_token(self, client, test_data):
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client, test_data):
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_profile_nickname(self, client, auth_headers, test_data):
        response = await client.put(
            "/api/auth/me",
            headers=auth_headers,
            json={"nickname": "新昵称"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nickname"] == "新昵称"

    @pytest.mark.asyncio
    async def test_update_profile_email(self, client, auth_headers, test_data):
        response = await client.put(
            "/api/auth/me",
            headers=auth_headers,
            json={"email": "newemail@example.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newemail@example.com"

    @pytest.mark.asyncio
    async def test_update_profile_duplicate_username(self, client, auth_headers, test_data):
        await client.post(
            "/api/auth/register",
            json={
                "username": "otheruser",
                "email": "other@example.com",
                "password": "password123",
            },
        )
        response = await client.put(
            "/api/auth/me",
            headers=auth_headers,
            json={"username": "otheruser"},
        )
        assert response.status_code == 400
        assert "用户名已被使用" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_update_profile_no_auth(self, client, test_data):
        response = await client.put(
            "/api/auth/me",
            json={"nickname": "test"},
        )
        assert response.status_code == 401
