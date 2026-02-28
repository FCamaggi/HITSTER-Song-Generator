# HITSTER - Generador de Canciones

Aplicación web para generar canciones aleatorias desde Spotify para usar con el juego físico HITSTER Bingo.

## 🚀 Deploy en Render

### Pasos para hacer deploy:

1. **Sube el código a GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <TU_REPO_URL>
   git push -u origin main
   ```

2. **Crea una cuenta en Render**
   - Ve a [https://render.com](https://render.com)
   - Regístrate con tu cuenta de GitHub

3. **Crea un nuevo Web Service**
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Render detectará automáticamente el `render.yaml`

4. **Configura las variables de entorno en Render**
   - En el dashboard de tu servicio, ve a "Environment"
   - Agrega estas variables:
     - `SPOTIFY_CLIENT_ID`: Tu Client ID de Spotify
     - `SPOTIFY_CLIENT_SECRET`: Tu Client Secret de Spotify
     - `APP_URL`: La URL que te dé Render (ej: `https://hitster-app.onrender.com`)
     - `NODE_ENV`: `production`

5. **Configura Spotify Developer Dashboard**
   - Ve a [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   - En tu aplicación, agrega la Redirect URI: `https://TU_APP.onrender.com/auth/callback`

6. **Deploy**
   - Render desplegará automáticamente
   - Obtendrás una URL con HTTPS

## 🏃‍♂️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
# Edita .env con tus credenciales de Spotify

# Ejecutar en desarrollo
npm run dev
```

## 📝 Variables de Entorno Requeridas

- `APP_URL`: URL donde está hosteada la app
- `SPOTIFY_CLIENT_ID`: Client ID de tu app de Spotify
- `SPOTIFY_CLIENT_SECRET`: Client Secret de tu app de Spotify

## 🎮 Uso

1. Conecta tu cuenta de Spotify
2. Carga una playlist (o usa la oficial de HITSTER)
3. Presiona "Siguiente" para generar una canción aleatoria
4. Escucha la canción sin ver la información
5. Presiona "Revelar" para ver año, título, artista y década
6. ¡Juega al HITSTER Bingo con las cartas físicas!
