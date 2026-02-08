#!/bin/bash

# Pharma Authenticity System - Quick Setup Script
# This script sets up the frontend with all required dependencies

echo "🚀 Setting up Pharma Authenticity Frontend..."

# Navigate to client directory
cd client

# Install axios for API calls
echo "📦 Installing axios..."
npm install axios

# Create .env file from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Remember to update VITE_CONTRACT_ADDRESS in .env file!"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

# Install all dependencies
echo "📦 Installing all dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env file with your contract address"
echo "2. Make sure backend is running at http://localhost:5000"
echo "3. Deploy updated smart contract (see CONTRACT_UPDATE_GUIDE.md)"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "📚 Documentation:"
echo "- IMPLEMENTATION.md - Full implementation details"
echo "- CONTRACT_UPDATE_GUIDE.md - Smart contract update guide"
echo ""
echo "Happy coding! 🎉"
