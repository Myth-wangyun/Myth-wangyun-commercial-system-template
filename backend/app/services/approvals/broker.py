from threading import Condition


class ApprovalStreamBroker:
    def __init__(self):
        self._version = 0
        self._condition = Condition()

    @property
    def version(self) -> int:
        with self._condition:
            return self._version

    def touch(self) -> int:
        with self._condition:
            self._version += 1
            self._condition.notify_all()
            return self._version

    def wait_for_change(self, version: int, timeout: float = 30.0) -> int:
        with self._condition:
            if self._version != version:
                return self._version
            self._condition.wait(timeout)
            return self._version


approval_stream_broker = ApprovalStreamBroker()
