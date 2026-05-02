from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    mongodb_url: str
    mongodb_db_name: str = "terra_viva"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 dias
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    dev_otp_default: str = "123456"

    # DigitalOcean Spaces (S3-compatible)
    do_spaces_key: str = ""
    do_spaces_secret: str = ""
    do_spaces_endpoint: str = "https://nyc3.digitaloceanspaces.com"
    do_spaces_region: str = "nyc3"
    do_spaces_bucket: str = "terraviva"
    do_spaces_folder: str = "terraviva/profiles"
    do_spaces_products_folder: str = "terraviva/products"

    # OpenAI
    openai_api_key: str = ""
    openai_vision_model: str = "gpt-4o"
    openai_image_model: str = "dall-e-2"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
