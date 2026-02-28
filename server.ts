import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import cookieParser from "cookie-parser";
import session from "express-session";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.set("trust proxy", 1); // Trust the first proxy (nginx)
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "hitster-secret-key",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        httpOnly: true,
      },
    })
  );

  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
  const REDIRECT_URI = `${APP_URL}/auth/callback`;

  // --- Auth Routes ---

  app.get("/api/auth/url", (req, res) => {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ 
        error: "Faltan credenciales de Spotify. Configura SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en los Secretos." 
      });
    }
    const scope = "user-read-private user-read-email streaming user-modify-playback-state user-read-playback-state playlist-read-private playlist-read-collaborative";
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID!,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: scope,
      show_dialog: "true",
    });
    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  app.get("/auth/callback", async (req, res) => {
    const code = req.query.code as string;

    if (!code) {
      return res.send("Error: No code provided");
    }

    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: REDIRECT_URI,
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      
      // Store in session
      (req as any).session.spotifyAccessToken = access_token;
      (req as any).session.spotifyRefreshToken = refresh_token;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', accessToken: '${access_token}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticación exitosa. Esta ventana se cerrará automáticamente.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Error exchanging code for token:", error.response?.data || error.message);
      res.status(500).send("Error during authentication");
    }
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({ 
      authenticated: !!(req as any).session?.spotifyAccessToken,
      accessToken: (req as any).session?.spotifyAccessToken
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy(() => {
      res.json({ success: true });
    });
  });

  // --- Spotify API Proxy ---

  app.get("/api/spotify/playlist-tracks", async (req, res) => {
    // Try to get token from header first, then session
    let accessToken = req.headers.authorization?.split(" ")[1] || (req as any).session?.spotifyAccessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: "No autenticado. Por favor, inicia sesión de nuevo." });
    }

    let playlistId = req.query.playlistId as string;
    console.log("Recibida petición para playlistId:", playlistId);

    // Si no hay ID o es un valor vacío, usamos la playlist del usuario por defecto
    if (!playlistId || playlistId.trim() === "" || playlistId === "default") {
      playlistId = "3R5PopMBy9SaOdOqUqKmX2";
    }

    console.log("Usando ID final para Spotify:", playlistId);

    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000
        }
      );
      console.log("Respuesta de Spotify exitosa. Canciones encontradas:", response.data.items?.length);
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      let message = error.response?.data?.error?.message || "Error al conectar con Spotify";
      
      if (status === 403) {
        message = "Error 403: Acceso denegado. Asegúrate de que tu email de Spotify esté en la lista 'Users and Access' de tu App en el Spotify Developer Dashboard.";
      }
      
      console.error("Error en Spotify API Proxy:", status, message);
      res.status(status).json({ error: message });
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
