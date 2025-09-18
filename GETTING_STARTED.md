# 🚀 Getting Started

This guide will help you set up and run the Todo Management System locally.

## ⚡ Quick Start

### 1. Install .NET 9.0 SDK

**Windows/macOS:**
- Visit [https://dotnet.microsoft.com/download/dotnet/9.0](https://dotnet.microsoft.com/download/dotnet/9.0)
- Download and install the .NET 9.0 SDK (not just the runtime)
- Verify: `dotnet --version` (should show 9.0.x)

**Ubuntu/Debian Linux:**
```bash
# Add Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update

# Install .NET 9.0 SDK
sudo apt install -y dotnet-sdk-9.0

# Verify installation
dotnet --version
```

**Manual Installation (Linux/macOS):**
```bash
# Download and extract .NET 9.0 SDK
cd ~
wget https://download.visualstudio.microsoft.com/download/pr/5226a5fa-8c0b-474f-b79a-8984ad7c5beb/3113ccbf789c9fd29972835f0f334b7a/dotnet-sdk-9.0.100-linux-x64.tar.gz
mkdir -p $HOME/dotnet
tar zxf dotnet-sdk-9.0.100-linux-x64.tar.gz -C $HOME/dotnet

# Add to PATH (add to ~/.bashrc or ~/.zshrc for persistence)
export DOTNET_ROOT=$HOME/dotnet
export PATH=$HOME/dotnet:$PATH

# Verify installation
dotnet --version
```

### 2. Trust HTTPS Certificate
```bash
dotnet dev-certs https --trust
```

### 3. Start the API
```bash
cd TodoApi
dotnet run
```
The API will be available at `https://localhost:7001`

### 4. Start the Frontend
Open a new terminal:
```bash
cd todo-frontend
npm install
npm start
```
The frontend will be available at `http://localhost:3000`

### 5. Login
Use the demo account:
- **Email**: `admin@todoapp.com`
- **Password**: `Admin123!`

## 🎯 What You'll See

- **120 pre-seeded todos** for testing pagination
- **8 categories** (Work, Personal, Shopping, etc.)
- **Full CRUD operations** with real-time updates
- **Advanced filtering** and search
- **Responsive design** that works on mobile

## 🔧 Additional Prerequisites

- **Node.js 18+** - [Download from Node.js](https://nodejs.org/)
- **Git** - [Download from Git](https://git-scm.com/)

## 🆘 Troubleshooting

### "dotnet: command not found"
- Ensure .NET 9.0 SDK is installed and in your PATH
- Restart your terminal after installation

### HTTPS Certificate Issues
- Run `dotnet dev-certs https --clean` then `dotnet dev-certs https --trust`
- On Linux, you may need to manually trust the certificate in your browser

### Port Already in Use
- API uses ports 7001 (HTTPS) and 5001 (HTTP)
- Frontend uses port 3000
- Kill any existing processes using these ports

### Database Issues
- Delete `TodoApi/todoapp.db` and restart the API
- The database will recreate automatically with seed data

## 📚 Next Steps

Once you're up and running:
1. Explore the **Swagger API documentation** at `https://localhost:7001`
2. Test the **search and filtering** features
3. Try **creating, editing, and deleting** todos
4. Check out the **pagination** with 120+ seeded todos
5. Review the **responsive design** on different screen sizes

For more detailed information, see the main [README.md](README.md).
