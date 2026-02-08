# Pharma Authenticity System - Quick Setup Script
# This script sets up the frontend with all required dependencies

Write-Host "🚀 Setting up Pharma Authenticity Frontend..." -ForegroundColor Cyan

# Navigate to client directory
Set-Location client

# Install axios for API calls
Write-Host "📦 Installing axios..." -ForegroundColor Yellow
npm install axios

# Create .env file from example
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Remember to update VITE_CONTRACT_ADDRESS in .env file!" -ForegroundColor Red
} else {
    Write-Host "ℹ️  .env file already exists, skipping..." -ForegroundColor Gray
}

# Install all dependencies
Write-Host "📦 Installing all dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env file with your contract address"
Write-Host "2. Make sure backend is running at http://localhost:5000"
Write-Host "3. Deploy updated smart contract (see CONTRACT_UPDATE_GUIDE.md)"
Write-Host "4. Run 'npm run dev' to start the development server"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- IMPLEMENTATION.md - Full implementation details"
Write-Host "- CONTRACT_UPDATE_GUIDE.md - Smart contract update guide"
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Green
