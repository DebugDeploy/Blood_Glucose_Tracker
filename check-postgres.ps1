# Sweety - PostgreSQL Health Check Script
Write-Host "`n🔍 Checking PostgreSQL status...`n" -ForegroundColor Cyan

# Check if PostgreSQL service exists and is running
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($null -eq $pgService) {
    Write-Host "❌ PostgreSQL service not found!" -ForegroundColor Red
    Write-Host "   PostgreSQL may not be installed.`n" -ForegroundColor Yellow
    Write-Host "📖 Installation guide:" -ForegroundColor Cyan
    Write-Host "   https://www.postgresql.org/download/windows/`n"
    Write-Host "   Or see SETUP_GUIDE.md for detailed instructions.`n"
    exit 1
}

Write-Host "✅ PostgreSQL service found: $($pgService.Name)" -ForegroundColor Green
Write-Host "   Status: $($pgService.Status)" -ForegroundColor $(if ($pgService.Status -eq 'Running') { 'Green' } else { 'Yellow' })

if ($pgService.Status -ne 'Running') {
    Write-Host "`n⚠️  PostgreSQL is not running!" -ForegroundColor Yellow
    Write-Host "   Starting PostgreSQL service...`n" -ForegroundColor Cyan
    
    try {
        Start-Service $pgService.Name -ErrorAction Stop
        Write-Host "✅ PostgreSQL service started successfully!`n" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to start PostgreSQL service." -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
        Write-Host "💡 Try running PowerShell as Administrator`n" -ForegroundColor Yellow
        exit 1
    }
}

# Check if .env file exists
Write-Host "📄 Checking configuration...`n" -ForegroundColor Cyan

if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check if DATABASE_URL is configured
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL=") {
        Write-Host "✅ DATABASE_URL is configured" -ForegroundColor Green
        
        # Extract and check if password is default
        if ($envContent -match "DATABASE_URL=.*:postgres@") {
            Write-Host "⚠️  Using default password 'postgres' - update if different!`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ DATABASE_URL not found in .env file`n" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Run: Copy-Item .env.example .env" -ForegroundColor Yellow
    Write-Host "   Then edit .env with your PostgreSQL password`n" -ForegroundColor Yellow
    exit 1
}

# Check if database exists (requires psql in PATH)
Write-Host "🗄️  Testing database connection...`n" -ForegroundColor Cyan

$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
if ($null -eq $psqlCommand) {
    Write-Host "⚠️  psql command not found in PATH" -ForegroundColor Yellow
    Write-Host "   Can't verify database, but PostgreSQL service is running.`n" -ForegroundColor Yellow
    Write-Host "💡 Add PostgreSQL bin folder to PATH to enable database checks.`n" -ForegroundColor Cyan
} else {
    Write-Host "✅ psql command available" -ForegroundColor Green
    Write-Host "   You can test connection manually with: psql -U postgres -l`n" -ForegroundColor Gray
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ PostgreSQL health check complete!`n" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure database 'sweety' exists" -ForegroundColor White
Write-Host "   2. Run: npm run db:init -w server" -ForegroundColor White
Write-Host "   3. Run: npm run seed -w server (optional)" -ForegroundColor White
Write-Host "   4. Run: npm run dev`n" -ForegroundColor White
Write-Host "📖 For detailed setup: See SETUP_GUIDE.md`n" -ForegroundColor Gray
