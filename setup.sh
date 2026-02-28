#!/bin/bash

echo "🎵 HITSTER - Setup Script"
echo "========================"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file already exists"
else
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANTE: Configura tus credenciales de Spotify en .env"
    echo "   1. Ve a https://developer.spotify.com/dashboard"
    echo "   2. Crea una nueva app"
    echo "   3. Copia SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET a .env"
    echo "   4. Agrega como Redirect URI: http://localhost:3000/auth/callback"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development server:"
echo "   npm run dev"
echo ""
echo "📖 For deployment instructions, see DEPLOY.md"
