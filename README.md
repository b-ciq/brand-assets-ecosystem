# 🎨 Brand Assets Ecosystem

**Integrated multi-interface brand asset management system with enhanced search, metadata, and deployment capabilities.**

## 🏗️ Architecture Overview

```
📁 brand-assets-ecosystem/
├── 📁 core-mcp-dev/           # Enhanced MCP server (development)
├── 📁 interfaces/
│   ├── 📁 web-gui/           # Next.js web browser interface
│   └── 📁 slack-app/         # Future Slack integration
├── 📁 shared/                # Common types and SDKs
└── 📁 docs/                  # Documentation
```

## 🚀 Quick Start

### Web GUI Development
```bash
cd interfaces/web-gui
npm install
npm run dev
# → http://localhost:3002
```

### MCP Development Server
```bash
cd core-mcp-dev  
python3 server.py
# → Local MCP server for development
```

## 🎯 Current Status

### ✅ Working Features
- **Web GUI**: Asset browsing, search, download
- **Asset Size**: Constrained to 100px max height
- **MCP Integration**: Both local and cloud endpoints supported
- **Shared Architecture**: Ready for multiple interfaces

### 🚧 In Development
- **Enhanced Metadata**: Human-readable names, better tagging
- **Improved Search**: Brand/layout/background filtering
- **PDF Previews**: Visual document previews
- **Slack Integration**: Team chat integration

## 🔄 Development Workflow

### Production vs Development
- **Production MCP**: `brand-assets` repo → FastMCP cloud
- **Development MCP**: `core-mcp-dev/` → Local testing
- **Web GUI**: Can connect to either endpoint

### Safe Development Process
1. **Modify** `core-mcp-dev/` for improvements
2. **Test** with web GUI locally
3. **Deploy** to staging FastMCP when ready
4. **Migrate** production when proven stable

## 📦 Components

### Core MCP Development (`core-mcp-dev/`)
Enhanced version of the original MCP with:
- Better metadata generation
- Improved search capabilities  
- Human-readable asset names
- Enhanced tagging system

### Web GUI (`interfaces/web-gui/`)
Next.js application providing:
- Visual asset browsing
- Advanced search and filtering
- Download functionality
- Responsive design

### Shared SDK (`shared/`)
Common utilities for:
- TypeScript interfaces
- API client libraries
- Shared business logic

## 🌐 Deployment

### Current Deployments
- **Production MCP**: `brand-asset-server.fastmcp.app` 
- **Claude Desktop**: Teams using production MCP ✅
- **Web GUI**: Local development only

### Planned Deployments  
- **Staging MCP**: New FastMCP endpoint for testing
- **Production Web GUI**: TBD (Vercel/Netlify)
- **Slack App**: Future integration

## 🛠️ Development Commands

### Install Dependencies
```bash
# Web GUI
cd interfaces/web-gui && npm install

# MCP (if needed)
cd core-mcp-dev && pip install -r requirements.txt
```

### Development Servers
```bash
# Web GUI (port 3002)
npm run dev

# MCP Server (local testing) 
python3 core-mcp-dev/server.py
```

### Testing
```bash
# Test MCP directly
python3 core-mcp-dev/cli_wrapper.py "CIQ logo"

# Test web GUI
# → Open http://localhost:3002
```

## 📚 Documentation

- [`GIT-CHEATSHEET.md`](./GIT-CHEATSHEET.md) - Git commands reference
- [`core-mcp-dev/README.md`](./core-mcp-dev/README.md) - MCP server details
- [`interfaces/web-gui/README.md`](./interfaces/web-gui/README.md) - Web GUI setup

## 🤝 Contributing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/enhanced-metadata

# Make changes, test locally
npm run dev  # test web gui
python3 core-mcp-dev/cli_wrapper.py "test"  # test mcp

# Commit and push
git add .
git commit -m "Add enhanced metadata generation"
git push origin feature/enhanced-metadata
```

### Testing Checklist
- [ ] Web GUI loads and displays assets
- [ ] Search functionality works
- [ ] Asset downloads work  
- [ ] MCP server responds to queries
- [ ] No breaking changes to existing APIs

## 🎯 Roadmap

### Phase 2: Enhanced Metadata (Next)
- Human-readable asset names
- Improved tagging and categorization
- Better search capabilities

### Phase 3: Visual Enhancements  
- PDF preview generation
- Multi-format support
- Enhanced asset viewer

### Phase 4: Team Integration
- Slack app development
- Deployment automation
- Team collaboration features

---

**🚀 Ready to enhance your brand asset workflow with enterprise-grade tooling!**