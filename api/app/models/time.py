from datetime import datetime, timezone


def utcnow():
    """Naive UTC timestamp, consistent across SQLite and PostgreSQL."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
