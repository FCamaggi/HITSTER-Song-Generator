# Solicitar Extended Quota Mode en Spotify

## ¿Por qué lo necesito?

Cuando creas una app de Spotify, comienza en **Development Mode**, que solo permite a usuarios específicos (agregados manualmente) usar la aplicación. Esto causa el error **403: Acceso denegado**.

Para que cualquiera pueda usar tu app, necesitas solicitar **Extended Quota Mode**.

---

## Pasos para solicitar Extended Quota Mode

### 1. Ve al Dashboard de Spotify
- Abre [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
- Inicia sesión con tu cuenta de Spotify

### 2. Selecciona tu App
- Click en tu aplicación (HITSTER Song Generator)

### 3. Ve a la sección "Quota Extension"
- En el menú lateral, busca **"Quota Extension"** o **"Request Extension"**
- Click en **"Request Extension"**

### 4. Completa el formulario

Spotify te pedirá información sobre tu app:

**¿Qué hace tu app?**
```
Esta aplicación genera canciones aleatorias desde playlists de Spotify 
para usarlas con el juego de mesa HITSTER Bingo. Los usuarios pueden:
- Conectar su cuenta de Spotify
- Cargar playlists personalizadas o usar la oficial de HITSTER
- Reproducir canciones sin ver información (año, artista, título)
- Revelar la información manualmente para jugar al juego físico

Es una herramienta complementaria para el juego físico HITSTER Bingo,
NO es un reproductor de música ni reemplaza a Spotify.
```

**¿Cuántos usuarios esperás?**
```
Entre 50-500 usuarios (jugadores del juego HITSTER Bingo)
```

**¿Tu app almacena datos de usuarios?**
```
No. Solo usamos el access token temporalmente durante la sesión para:
- Autenticar al usuario
- Acceder a sus playlists públicas
- Reproducir previews de canciones

NO almacenamos credenciales ni información personal.
```

**¿Tu app cumple con los términos de Spotify?**
```
Sí. La app:
- Usa la API de Spotify solo para reproducir música legalmente
- Muestra correctamente las atribuciones a Spotify
- No descarga ni guarda música
- No modifica ni copia contenido de Spotify
```

### 5. Envía la solicitud
- Click en **"Submit"**
- Spotify revisará tu solicitud (puede tomar 1-7 días)

### 6. Mientras esperas...

**Solución temporal:** Agrega manualmente los emails de los usuarios que quieran probar tu app:

1. En tu app del Dashboard → **"Settings"**
2. Busca **"Users and Access"**
3. Click en **"Add User"**
4. Ingresa el email de Spotify del usuario
5. Click en **"Add"**

⚠️ **Importante:** Los usuarios deben autenticarse con el **mismo email** que agregaste.

---

## Alternativa: Modo Production

Si tu app necesita más de 25 usuarios inmediatamente, puedes solicitar **Production Mode**, pero requiere:
- Cumplir con todos los términos de uso de Spotify
- Tener una política de privacidad
- Pasar una revisión más estricta de Spotify

Para la mayoría de casos, **Extended Quota Mode** es suficiente.

---

## Verificar con qué usuario te autenticaste

La app ahora muestra el email del usuario autenticado en el header (esquina superior derecha).

Si ves un error 403, verifica que:
1. El email mostrado en el header coincida con el que agregaste en "Users and Access"
2. Si no coinciden, cierra sesión y vuelve a autenticarte con el email correcto

---

## Links útiles

- [Spotify Dashboard](https://developer.spotify.com/dashboard)
- [Documentación de Quotas](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
- [Términos de Uso](https://developer.spotify.com/terms)
