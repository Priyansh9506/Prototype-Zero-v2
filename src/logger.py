import logging
import sys
from src.config import settings

def setup_logger(name: str) -> logging.Logger:
    """
    Creates a standard logger configured according to the application settings.
    """
    logger = logging.getLogger(name)
    
    # Only configure if it doesn't have handlers
    if not logger.handlers:
        logger.setLevel(settings.LOG_LEVEL)
        
        # Create console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(settings.LOG_LEVEL)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        
        logger.addHandler(handler)
        
    return logger
