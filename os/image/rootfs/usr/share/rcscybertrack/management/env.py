import os
import logging
from pathlib import Path

logger = logging.getLogger("rcscybertrack.env")

_ENV_LOADED = False

def load_dotenv_config(env_path: Path | str | None = None) -> bool:
    """
    Locates and loads environment variables from a .env file into os.environ.
    Returns True if an .env file was successfully loaded.
    """
    global _ENV_LOADED
    if _ENV_LOADED and env_path is None:
        return True

    if env_path is None:
        explicit_env = os.getenv("CYBERTRACK_ENV_FILE")
        if explicit_env:
            target_path = Path(explicit_env)
        else:
            # Default to root directory .env file relative to this module
            base_dir = Path(__file__).resolve().parent.parent
            target_path = base_dir / ".env"
    else:
        target_path = Path(env_path)

    if not target_path.exists():
        logger.debug("No .env file found at %s. Using default/system environment variables.", target_path)
        return False

    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=target_path, override=False)
        _ENV_LOADED = True
        logger.info("Successfully loaded environment configuration from %s", target_path)
        return True
    except ImportError:
        # Fallback pure-python parser if python-dotenv is not present
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("'\"")
                        if key not in os.environ:
                            os.environ[key] = val
            _ENV_LOADED = True
            logger.info("Loaded .env using fallback parser from %s", target_path)
            return True
        except Exception as e:
            logger.warning("Failed to parse .env file at %s: %s", target_path, e)
            return False

# Automatically invoke load_dotenv_config when module is imported
load_dotenv_config()
