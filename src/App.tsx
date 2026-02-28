/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { 
  Play, 
  SkipForward, 
  Eye, 
  EyeOff, 
  Music, 
  User, 
  Users, 
  Calendar, 
  ExternalLink,
  LogOut,
  Settings,
  RefreshCw,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: {
    name: string;
    release_date: string;
    images: { url: string }[];
  };
  uri: string;
  preview_url: string | null;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [shuffledTracks, setShuffledTracks] = useState<SpotifyTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artistDetails, setArtistDetails] = useState<Record<string, any>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Check auth status on mount
  useEffect(() => {
    fetch("/api/auth/status")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAccessToken(data.accessToken);
        }
      });
  }, []);

  // Listen for OAuth success message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow messages from same origin or localhost
      const allowedOrigins = [
        window.location.origin,
        'http://localhost:3000',
        'https://localhost:3000'
      ];
      
      if (!allowedOrigins.includes(origin) && !origin.endsWith('.onrender.com')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsAuthenticated(true);
        setAccessToken(event.data.accessToken);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = () => {
    setError(null);
    // Abrimos la ventana inmediatamente para que iOS no la bloquee
    const authWindow = window.open("about:blank", "spotify_auth", "width=600,height=700");
    
    if (!authWindow) {
      setError("Ventana bloqueada. En iOS: Ajustes > Safari > Bloquear ventanas (Desactivar).");
      return;
    }

    fetch("/api/auth/url")
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          authWindow.location.href = data.url;
        } else {
          authWindow.close();
          setError(data.error || "Error al obtener la URL de autenticación");
        }
      })
      .catch(err => {
        authWindow.close();
        setError("Error de conexión con el servidor.");
      });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setAccessToken(null);
    setTracks([]);
    setCurrentTrack(null);
  };

  const extractPlaylistId = (input: string) => {
    if (!input) return "";
    const cleanInput = input.trim();
    
    // Si es un link de spotify, buscamos la parte después de /playlist/
    if (cleanInput.includes("spotify.com")) {
      try {
        const parts = cleanInput.split("/");
        const playlistIndex = parts.findIndex(p => p.includes("playlist"));
        if (playlistIndex !== -1 && parts[playlistIndex + 1]) {
          return parts[playlistIndex + 1].split("?")[0];
        }
      } catch (e) {
        console.error("Error parsing URL", e);
      }
    }
    
    // Si no es un link, devolvemos el texto limpio (asumiendo que es el ID)
    return cleanInput;
  };

  const fetchPlaylist = async (manualId?: string) => {
    const targetUrl = manualId || playlistUrl;
    if (!targetUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    // Extraer y limpiar el ID de forma agresiva
    let playlistId = extractPlaylistId(targetUrl);
    playlistId = playlistId.replace(/[^a-zA-Z0-9]/g, "").trim(); // Solo alfanuméricos
    
    if (!playlistId) {
      setError("ID de playlist no válido.");
      setIsLoading(false);
      return;
    }
    
    try {
      // Simplificación máxima para evitar errores de patrón en iOS/Safari
      const endpoint = `/api/spotify/playlist-tracks?playlistId=${playlistId}`;
      
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: No se pudo cargar la playlist`);
      }
      
      const extractedTracks = (data.items || [])
        .filter((item: any) => item && item.track)
        .map((item: any) => item.track);
      
      if (extractedTracks.length === 0) {
        throw new Error("La playlist está vacía o no es pública.");
      }

      setTracks(extractedTracks);
      
      // Mezclar la lista inmediatamente
      const shuffled = [...extractedTracks].sort(() => Math.random() - 0.5);
      setShuffledTracks(shuffled);
      setCurrentIndex(0);
      const firstTrack = shuffled[0];
      setCurrentTrack(firstTrack);
      setShowInfo(false);
      setIsPlaying(false);
      if (firstTrack) fetchArtistInfo(firstTrack.artists[0].id);
    } catch (err: any) {
      console.error("Fetch error details:", err);
      setError(err.message || "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const pickRandomTrack = () => {
    if (shuffledTracks.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    if (nextIndex >= shuffledTracks.length) {
      // Si se acaba la lista, volvemos a mezclar
      const newShuffled = [...tracks].sort(() => Math.random() - 0.5);
      setShuffledTracks(newShuffled);
      nextIndex = 0;
    }
    
    const track = shuffledTracks[nextIndex];
    setCurrentIndex(nextIndex);
    setCurrentTrack(track);
    setShowInfo(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
    fetchArtistInfo(track.artists[0].id);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Error playing audio", e));
    }
    setIsPlaying(!isPlaying);
  };

  const fetchArtistInfo = async (artistId: string) => {
    if (!accessToken || artistDetails[artistId]) return;
    
    try {
      const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setArtistDetails(prev => ({ ...prev, [artistId]: data }));
    } catch (err) {
      console.error("Error fetching artist info", err);
    }
  };

  const getArtistType = (track: SpotifyTrack) => {
    if (track.artists.length > 1) return "feat";
    const primaryArtist = artistDetails[track.artists[0].id];
    if (!primaryArtist) return "loading";
    
    // Simple heuristic: if genres include 'band' or 'group' or if it's a known group
    // Spotify doesn't explicitly say "group" or "soloist" in a single field
    // but we can look at genres or just use a generic icon
    return "artist"; 
  };

  const getYear = (date: string) => {
    return date.split("-")[0];
  };

  const getDecade = (date: string) => {
    const year = parseInt(date.split("-")[0]);
    const decade = Math.floor(year / 10) * 10;
    return `años ${decade.toString().slice(-2)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="inline-block p-4 bg-green-500 rounded-full mb-4">
            <Music size={48} className="text-black" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            HITSTER <span className="text-green-500">GEN</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Conecta tu cuenta de Spotify para generar canciones aleatorias para tu partida de HITSTER.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 rounded-full transition-all flex items-center justify-center gap-3 text-xl"
          >
            Conectar con Spotify
          </button>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <div className="pt-8 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
              Requiere cuenta de Spotify
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-green-500/30 overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 p-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-xl shadow-lg shadow-green-500/20">
            <Music size={20} className="text-black" />
          </div>
          <span className="font-black tracking-tighter text-2xl italic uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">HITSTER</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-12 relative z-10">
        {/* Playlist Input Section */}
        <section className="max-w-2xl mx-auto">
          <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-zinc-500 mb-1">
              <Settings size={14} className="animate-spin-slow" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Configuración de Origen</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-green-500 transition-colors">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Link de playlist o deja vacío..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-green-500/50 transition-all outline-none text-sm placeholder:text-zinc-600"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => fetchPlaylist()}
                  disabled={isLoading}
                  className="bg-white text-black font-bold px-6 py-4 rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={20} /> : "Cargar"}
                </button>
                <button 
                  onClick={() => { 
                    const id = "3R5PopMBy9SaOdOqUqKmX2";
                    setPlaylistUrl("https://open.spotify.com/playlist/" + id); 
                    fetchPlaylist(id); 
                  }}
                  disabled={isLoading}
                  className="bg-zinc-800 text-white font-bold px-6 py-4 rounded-2xl hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  title="Playlist HITSTER oficial"
                >
                  <RefreshCw size={20} />
                  <span className="hidden sm:inline">HITSTER Mix</span>
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs font-medium px-2">{error}</p>}
            {tracks.length > 0 && (
              <div className="flex items-center gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  {tracks.length} Canciones Listas
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Game Area */}
        <section className="flex flex-col items-center justify-center space-y-12">
          <AnimatePresence mode="wait">
            {currentTrack ? (
              <div className="w-full flex flex-col items-center space-y-12">
                <motion.div 
                  key={currentTrack.id}
                  initial={{ opacity: 0, y: 40, rotateX: 20 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -40, rotateX: -20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  className="w-full max-w-[340px] sm:max-w-[380px] aspect-[3/4.2] relative perspective-1000"
                >
                  {/* The "Card" */}
                  <div className={`w-full h-full rounded-[3rem] overflow-hidden border transition-all duration-1000 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] ${showInfo ? 'border-green-500/50 bg-zinc-900' : 'border-white/10 bg-[#111]'}`}>
                    
                    {/* Hidden State */}
                    {!showInfo && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                          <div className="w-28 h-28 bg-zinc-800/50 rounded-full flex items-center justify-center relative border border-white/5">
                            <Music size={48} className="text-zinc-600" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h2 className="text-3xl font-black tracking-tighter text-zinc-400 uppercase italic">¿QUÉ AÑO?</h2>
                          <p className="text-zinc-600 text-sm font-medium leading-relaxed">
                            Escucha la pista y coloca la carta en tu línea del tiempo.
                          </p>
                        </div>
                        
                        {/* Audio Controls (Custom or Masked Spotify) */}
                        <div className="pt-8 w-full space-y-4">
                          {currentTrack.preview_url ? (
                            <button 
                              onClick={togglePlay}
                              className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto shadow-xl hover:scale-110 active:scale-95 transition-all"
                            >
                              {isPlaying ? <div className="w-6 h-6 bg-black rounded-sm" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>
                          ) : (
                            <div className="relative w-full h-20 rounded-2xl overflow-hidden bg-black border border-white/5">
                              {/* Mask to hide song info */}
                              <div className="absolute inset-0 z-10 bg-zinc-900 flex items-center justify-start px-6 pointer-events-none">
                                <div className="flex items-center gap-3">
                                  <Play size={16} className="text-green-500 animate-pulse" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Dale al Play para escuchar</span>
                                </div>
                              </div>
                              {/* The actual player is behind but clickable on the left side where the play button is */}
                              <iframe 
                                src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`} 
                                width="100%" 
                                height="80" 
                                frameBorder="0" 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                loading="lazy"
                                className="opacity-100"
                              ></iframe>
                              {/* Second mask for the right side to ensure info is hidden even if iframe shifts */}
                              <div className="absolute top-0 right-0 bottom-0 left-20 z-20 bg-zinc-900 pointer-events-none border-l border-white/5" />
                            </div>
                          )}
                          
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: isPlaying ? "100%" : "0%" }}
                              transition={{ duration: 30, ease: "linear" }}
                              className="h-full bg-green-500/40"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Revealed State */}
                    <AnimatePresence>
                      {showInfo && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex flex-col"
                        >
                          {/* Album Art */}
                          <div className="h-[55%] relative overflow-hidden">
                            <img 
                              src={currentTrack.album.images[0]?.url} 
                              alt={currentTrack.album.name}
                              className="w-full h-full object-cover scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
                            <motion.div 
                              initial={{ x: 20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="absolute top-8 right-8 bg-green-500 text-black font-black text-5xl px-6 py-3 rounded-[1.5rem] shadow-2xl transform rotate-3 border-4 border-black"
                            >
                              {getYear(currentTrack.album.release_date)}
                            </motion.div>
                          </div>

                          {/* Info */}
                          <div className="p-10 flex-1 flex flex-col justify-between bg-zinc-900">
                            <div className="space-y-3">
                              <h3 className="text-3xl font-black leading-[0.9] tracking-tighter uppercase italic text-white">
                                {currentTrack.name}
                              </h3>
                              <div className="flex items-center gap-2 text-green-500/80">
                                {getArtistType(currentTrack) === "feat" ? <Users size={16} /> : <User size={16} />}
                                <span className="font-bold text-sm uppercase tracking-wider">
                                  {currentTrack.artists.map(a => a.name).join(", ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar size={14} />
                                <span className="font-bold text-xs uppercase tracking-wider">
                                  {getDecade(currentTrack.album.release_date)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                              <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                                <Calendar size={12} />
                                <span className="truncate max-w-[150px]">{currentTrack.album.name}</span>
                              </div>
                              <div className="bg-white/5 px-3 py-1.5 rounded-lg text-zinc-400 text-[10px] font-black tracking-widest uppercase">
                                {getArtistType(currentTrack) === "feat" ? "FEAT" : "ORIGINAL"}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Sound Controls & Player */}
                <div className="w-full max-w-md space-y-6">
                  <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => setShowInfo(!showInfo)}
                      className={`flex items-center gap-3 px-10 py-5 rounded-3xl font-black uppercase italic tracking-tighter transition-all active:scale-95 ${showInfo ? 'bg-zinc-800 text-zinc-400 border border-white/5' : 'bg-white text-black hover:bg-zinc-200 shadow-xl shadow-white/10'}`}
                    >
                      {showInfo ? <EyeOff size={24} /> : <Eye size={24} />}
                      {showInfo ? "Ocultar" : "Revelar"}
                    </button>
                    
                    <button 
                      onClick={() => pickRandomTrack()}
                      className="flex items-center gap-3 px-10 py-5 rounded-3xl bg-green-500 text-black font-black uppercase italic tracking-tighter hover:bg-green-400 active:scale-95 transition-all shadow-xl shadow-green-500/20"
                    >
                      <SkipForward size={24} fill="currentColor" />
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8 py-32">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                  <div className="w-32 h-32 bg-zinc-900 border border-white/5 rounded-[2.5rem] flex items-center justify-center relative">
                    <Music size={48} className="text-zinc-700" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">LISTO PARA EMPEZAR</h2>
                  <p className="text-zinc-500 max-w-xs mx-auto font-medium">
                    Carga la playlist oficial o usa una propia para comenzar tu partida.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Hidden Audio Element */}
      {currentTrack?.preview_url && (
        <audio 
          ref={audioRef} 
          src={currentTrack.preview_url} 
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Footer */}
      <footer className="p-12 text-center border-t border-white/5 mt-20">
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">
          HITSTER GEN &bull; Crafted for Game Nights
        </p>
      </footer>
    </div>
  );
}
