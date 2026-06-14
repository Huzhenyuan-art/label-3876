import pytest


class TestChatMessages:
    @pytest.mark.asyncio
    async def test_get_chat_messages_empty(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.get(f"/api/chat/{shop.id}")
        assert response.status_code == 200
        messages = response.json()
        assert isinstance(messages, list)
        assert len(messages) == 0

    @pytest.mark.asyncio
    async def test_send_message_buyer(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "你好，请问有货吗？", "sender": "buyer"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "你好，请问有货吗？"
        assert data["sender"] == "buyer"
        assert data["shop_id"] == shop.id
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_send_message_seller(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "您好，有货的", "sender": "seller"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sender"] == "seller"

    @pytest.mark.asyncio
    async def test_send_message_empty_content(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "", "sender": "buyer"},
        )
        assert response.status_code == 400
        assert "cannot be empty" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_send_message_whitespace_content(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "   ", "sender": "buyer"},
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_send_message_invalid_sender(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "test", "sender": "invalid"},
        )
        assert response.status_code == 400
        assert "Invalid sender" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_send_message_nonexistent_shop(self, client, test_data):
        response = await client.post(
            "/api/chat/99999",
            json={"content": "test", "sender": "buyer"},
        )
        assert response.status_code == 404
        assert "Shop not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_send_message_idempotent_with_client_id(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]
        client_id = "test-client-123"

        response1 = await client.post(
            f"/api/chat/{shop.id}",
            json={
                "content": "这是一条测试消息",
                "sender": "buyer",
                "client_id": client_id,
            },
        )
        assert response1.status_code == 200
        msg1 = response1.json()
        msg1_id = msg1["id"]

        response2 = await client.post(
            f"/api/chat/{shop.id}",
            json={
                "content": "这是一条测试消息",
                "sender": "buyer",
                "client_id": client_id,
            },
        )
        assert response2.status_code == 200
        msg2 = response2.json()
        assert msg2["id"] == msg1_id

    @pytest.mark.asyncio
    async def test_get_chat_messages_after_sending(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "消息1", "sender": "buyer"},
        )
        await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "消息2", "sender": "seller"},
        )

        response = await client.get(f"/api/chat/{shop.id}")
        assert response.status_code == 200
        messages = response.json()
        assert len(messages) == 2
        assert messages[0]["content"] == "消息1"
        assert messages[1]["content"] == "消息2"

    @pytest.mark.asyncio
    async def test_get_chat_messages_ordered_by_time(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "第一条", "sender": "buyer"},
        )
        await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "第二条", "sender": "seller"},
        )
        await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "第三条", "sender": "buyer"},
        )

        response = await client.get(f"/api/chat/{shop.id}")
        messages = response.json()
        assert len(messages) == 3
        assert messages[0]["content"] == "第一条"
        assert messages[2]["content"] == "第三条"

    @pytest.mark.asyncio
    async def test_chat_message_has_msg_type(self, client, test_data):
        shops = test_data["shops"]
        shop = shops[0]

        response = await client.post(
            f"/api/chat/{shop.id}",
            json={"content": "test", "sender": "buyer"},
        )
        data = response.json()
        assert "msg_type" in data
        assert data["msg_type"] == "text"
