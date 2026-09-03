# GitHub Pages deploy (requires gh auth login)
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location "C:\Users\jalin.you\AJ-WORK\building-tech-law-web"

gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to GitHub:" -ForegroundColor Yellow
    gh auth login --hostname github.com --git-protocol https --web
}

$repo = "building-tech-law-web"
$user = (gh api user -q .login)
gh repo view "$user/$repo" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    gh repo create $repo --public --source=. --remote=origin --push --description "Building technical rules (design, structure, equipment) - mobile web"
} else {
    git push -u origin main
}

gh api -X POST "repos/$user/$repo/pages" -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>$null
if ($LASTEXITCODE -ne 0) {
    gh api -X PUT "repos/$user/$repo/pages" -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>$null
}

$url = "https://$user.github.io/$repo/"
Write-Host ""
Write-Host "Deployed!" -ForegroundColor Green
Write-Host "URL: $url" -ForegroundColor Cyan
