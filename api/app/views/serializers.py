from app.services.auth_service import phone_of


def iso(moment):
    return moment.isoformat() + "Z" if moment else None


def user_public(user):
    return {"id": user.id, "full_name": user.full_name, "role": user.role}


def user_private(user):
    return {
        **user_public(user),
        "email": user.email,
        "phone": phone_of(user),
        "invite_code": user.invite_code,
    }


def alert(item):
    if not item:
        return None
    return {
        "id": item.id,
        "status": item.status,
        "started_at": iso(item.started_at),
        "closed_at": iso(item.closed_at),
    }


def point(item):
    return {"lat": item["lat"], "lng": item["lng"], "recorded_at": iso(item["recorded_at"])}


def live_status(status):
    trail = [point(p) for p in status["trail"]]
    return {
        "user": user_public(status["user"]),
        "alert": alert(status["alert"]),
        "last_location": trail[-1] if trail else None,
        "trail": trail,
        "signal_lost": status["signal_lost"],
    }
