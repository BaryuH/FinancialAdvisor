from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="Financial Tracker API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")

    postgres_user: str = Field(default="slacker", alias="POSTGRES_USER")
    postgres_password: str = Field(default="slackerpass", alias="POSTGRES_PASSWORD")
    postgres_db: str = Field(default="fainance_db", alias="POSTGRES_DB")
    postgres_host: str = Field(default="localhost", alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5433, alias="POSTGRES_PORT")

    database_url: str = Field(
        default="postgresql+psycopg://slacker:slackerpass@localhost:5433/fainance_db",
        alias="DATABASE_URL",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: object) -> object:
        """Render/Heroku-style URLs use postgresql://; SQLAlchemy+psycopg3 needs postgresql+psycopg://."""
        if not isinstance(v, str):
            return v
        if v.startswith("postgresql+psycopg://"):
            return v
        if v.startswith("postgresql://"):
            return "postgresql+psycopg://" + v.removeprefix("postgresql://")
        if v.startswith("postgres://"):
            return "postgresql+psycopg://" + v.removeprefix("postgres://")
        return v

    jwt_secret_key: str = Field(
        default="change-this-dev-secret-key-at-least-32-chars",
        alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_minutes: int = Field(default=10080, alias="REFRESH_TOKEN_EXPIRE_MINUTES")

    ocr_api_url: str = Field(default="http://n3.ckey.vn:1707/api/process/image", alias="OCR_API_URL")
    asr_api_url: str = Field(default="http://n3.ckey.vn:1707/api/process/audio", alias="ASR_API_URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()