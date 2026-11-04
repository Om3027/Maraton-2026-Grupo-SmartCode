import re

from flask import request

from app.models.user import ROLE_GUARDIAN, ROLE_USER
from app.services.errors import ServiceError

EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,189}\.[A-Za-z]{2,}$")
PHONE_RE = re.compile(r"^\+?[0-9]{7,15}$")
INVITE_RE = re.compile(r"^[A-Z0-9]{8}$")


def invalid(message):
    return ServiceError(400, message)


def json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise invalid("La solicitud no tiene un formato válido.")
    return data


def text(data, field, min_len, max_len):
    value = data.get(field)
    if not isinstance(value, str) or not min_len <= len(value.strip()) <= max_len:
        raise invalid(f"Revisa el campo '{field}'.")
    return value.strip()


def email(data):
    value = text(data, "email", 3, 254).lower()
    if not EMAIL_RE.match(value):
        raise invalid("Escribe un correo electrónico válido.")
    return value


def password(data):
    value = data.get("password")
    if not isinstance(value, str) or not 8 <= len(value) <= 72:
        raise invalid("La contraseña debe tener entre 8 y 72 caracteres.")
    if not (re.search(r"[A-Za-z]", value) and re.search(r"[0-9]", value)):
        raise invalid("La contraseña debe tener al menos una letra y un número.")
    return value


def role(data):
    value = data.get("role")
    if value not in (ROLE_USER, ROLE_GUARDIAN):
        raise invalid("Elige un tipo de cuenta válido.")
    return value


def optional_phone(data):
    value = data.get("phone")
    if value in (None, ""):
        return None
    if not isinstance(value, str):
        raise invalid("Escribe un número de teléfono válido.")
    value = value.replace(" ", "")
    if not PHONE_RE.match(value):
        raise invalid("Escribe un número de teléfono válido.")
    return value


def invite_code(data):
    value = data.get("invite_code")
    value = value.strip().upper() if isinstance(value, str) else ""
    if not INVITE_RE.match(value):
        raise invalid("El código de invitación tiene 8 letras o números.")
    return value


def coordinate(data, field, limit):
    value = data.get(field)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not -limit <= value <= limit:
        raise invalid("La ubicación recibida no es válida.")
    return round(float(value), 6)
