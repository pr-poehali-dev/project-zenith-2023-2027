"""
Авторизация пользователей: SMS-код или email+пароль.
Поддерживает регистрацию и вход для клинеров и заказчиков.
v2
"""
import json
import os
import random
import string
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p2863626_project_zenith_2023_")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_hex(32)

def ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(data)}

def err(msg: str, code: int = 400) -> dict:
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg})}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    # Роутинг: action из body или последний сегмент path
    path = event.get("path", "/")
    action = body.get("action") or path.strip("/").split("/")[-1]

    # send-code — отправка SMS-кода
    if action == "send-code":
        phone = body.get("phone", "").strip()
        if not phone:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите номер телефона"})}

        code = "".join(random.choices(string.digits, k=6))
        expires_at = datetime.now() + timedelta(minutes=10)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.sms_codes (phone, code, expires_at) VALUES (%s, %s, %s)",
            (phone, code, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()

        # В продакшене здесь отправка SMS через провайдера
        # Пока возвращаем код в ответе для тестирования
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"success": True, "code": code, "message": "Код отправлен"}),
        }

    # verify-code — проверка SMS-кода и вход/регистрация
    if action == "verify-code":
        phone = body.get("phone", "").strip()
        code = body.get("code", "").strip()
        role = body.get("role", "customer")

        if not phone or not code:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите телефон и код"})}

        conn = get_conn()
        cur = conn.cursor()

        cur.execute(
            f"SELECT id FROM {SCHEMA}.sms_codes WHERE phone=%s AND code=%s AND used=FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            (phone, code)
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный или истёкший код"})}

        sms_id = row[0]
        cur.execute(f"UPDATE {SCHEMA}.sms_codes SET used=TRUE WHERE id=%s", (sms_id,))

        cur.execute(f"SELECT id, name, role FROM {SCHEMA}.users WHERE phone=%s", (phone,))
        user = cur.fetchone()
        if not user:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (phone, role) VALUES (%s, %s) RETURNING id, name, role",
                (phone, role)
            )
            user = cur.fetchone()

        user_id, name, user_role = user
        token = generate_token()
        expires_at = datetime.now() + timedelta(days=30)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user_id, token, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"success": True, "token": token, "user": {"id": user_id, "name": name, "role": user_role, "phone": phone}}),
        }

    # login — вход через email + пароль
    if action == "login":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        if not email or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите email и пароль"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, role, password_hash FROM {SCHEMA}.users WHERE email=%s",
            (email,)
        )
        user = cur.fetchone()
        if not user or user[3] != hash_password(password):
            cur.close()
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}

        user_id, name, user_role, _ = user
        token = generate_token()
        expires_at = datetime.now() + timedelta(days=30)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user_id, token, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"success": True, "token": token, "user": {"id": user_id, "name": name, "role": user_role, "email": email}}),
        }

    # register — регистрация через email + пароль
    if action == "register":
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        name = body.get("name", "").strip()
        role = body.get("role", "customer")

        if not email or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите email и пароль"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email=%s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Email уже зарегистрирован"})}

        cur.execute(
            f"INSERT INTO {SCHEMA}.users (email, password_hash, name, role) VALUES (%s, %s, %s, %s) RETURNING id",
            (email, hash_password(password), name, role)
        )
        user_id = cur.fetchone()[0]
        token = generate_token()
        expires_at = datetime.now() + timedelta(days=30)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user_id, token, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"success": True, "token": token, "user": {"id": user_id, "name": name, "role": role, "email": email}}),
        }

    # me — проверка токена
    if action == "me":
        auth = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")
        if not auth:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет токена"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.name, u.role, u.phone, u.email FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id=u.id WHERE s.token=%s AND s.expires_at > NOW()",
            (auth,)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"user": {"id": user[0], "name": user[1], "role": user[2], "phone": user[3], "email": user[4]}}),
        }

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}