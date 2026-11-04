class ServiceError(Exception):
    """Business error with an HTTP status and a user-facing Spanish message."""

    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message
