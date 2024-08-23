import logging


logger = logging.getLogger("backend")
logger.setLevel(logging.INFO)


console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter("[%(name)s] %(levelname)s: %(message)s")
console_handler.setFormatter(formatter)

logger.addHandler(console_handler)
