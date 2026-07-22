import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql://root:root@localhost:3306/neighborly"
    JWT_SECRET: str = "7f5b331f49615a6b73ebf61a1532ee3d1c1a9386d8b375b486588cfcd56e9c93"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("mysql://"):
            url = url.replace("mysql://", "mysql+pymysql://", 1)
        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
