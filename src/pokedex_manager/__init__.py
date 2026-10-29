from pokedex_manager.app import create_app
from pokedex_manager.config import Settings

app = create_app(Settings.from_env())
