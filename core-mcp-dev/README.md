# 🎨 CIQ Brand Assets MCP Server

**✅ PRODUCTION READY** - Cloud-hosted intelligent brand asset delivery for your CIQ design team

[![FastMCP 2.0](https://img.shields.io/badge/FastMCP-2.0-blue.svg)](https://github.com/jlowin/fastmcp)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)

**Get the perfect logo recommendation through natural language conversation with Claude!**

---

## 🚀 **Quick Team Setup**

### **For Team Members (Zero Installation Required):**

**1. Add to Claude Desktop config:**
```json
{
  "mcpServers": {
    "ciq-brand-assets": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://brand-asset-server.fastmcp.app/mcp"
      ]
    }
  }
}
```

**2. Restart Claude Desktop**

**3. Start using:**
- *"I need a CIQ logo"*
- *"Fuzzball horizontal lockup for dark background"*
- *"Warewulf symbol for email signature"*

**That's it!** ✅ No Python, no FastMCP, no local server needed.

---

## 🎯 **What This Server Does**

### **Intelligent Logo Recommendations**
- **CIQ Company Brand:** 1-color (standard) vs 2-color (hero) selection
- **Product Brands:** Symbol, horizontal lockup, or vertical lockup options
- **Smart Questions:** Guides you to the perfect variant for your use case
- **Brand Compliance:** Built-in usage guidelines and best practices

### **Natural Language Interface**
```
You: "I need a logo for our homepage header"
Server: "CIQ logo - got it! Do you want 1-color (standard) or 2-color (hero) version?"
You: "Hero version for light background"  
Server: "Perfect! Here's your CIQ 2-color logo: [download link]"
```

---

## 📦 **Available Products**

### **CIQ (Company Brand)**
- **Structure:** 1-color and 2-color versions only
- **Use:** Main company branding

### **Product Brands**
Each has symbol-only, horizontal lockup, and vertical lockup variants:

- **Fuzzball** - HPC/AI workload management platform
- **Warewulf** - HPC cluster provisioning tool  
- **Apptainer** - Container platform for HPC/scientific workflows
- **Ascender** - Infrastructure automation platform (Ansible alternative)
- **Bridge** - CentOS 7 migration solution
- **RLC(X)** - Rocky Linux Commercial variants (RLC-AI, RLC-Hardened)
- **CIQ-Support** - Support division branding

---

## 🔧 **For Administrators**

### **Adding New Assets:**
```bash
# 1. Add logo files to appropriate directory following naming convention
# 2. Regenerate metadata
python generate_metadata.py

# 3. Push to GitHub (auto-deploys to team)
git add . && git commit -m "Add new assets" && git push
```

### **Adding New Products:**
```bash
# 1. Create NewProduct-logos/ directory
# 2. Add logo files following naming patterns
# 3. Auto-discover and deploy
python generate_metadata.py
git add . && git commit -m "Add NewProduct" && git push
```

### **Local Development:**
```bash
# Run local server for development
python ciq_brand_assets_fastmcp.py

# Test with Claude Desktop (local config):
{
  "mcpServers": {
    "ciq-brand-assets-local": {
      "command": "python",
      "args": ["/path/to/ciq_brand_assets_fastmcp.py"]
    }
  }
}
```

---

## 💬 **Example Conversations**

### **CIQ Company Logo:**
```
You: "CIQ logo for presentation slide"
Claude: "CIQ logo - got it! 1-color (standard) or 2-color (hero)?"
You: "Hero version for white background"
Claude: "Here's your CIQ 2-color logo: [download] - Maximum brand recognition"
```

### **Product Logos:**
```
You: "Fuzzball logo for business card"
Claude: "Fuzzball - HPC/AI platform. Symbol only, horizontal, or vertical lockup?"
You: "Horizontal for light background"
Claude: "Here's your Fuzzball horizontal lockup: [download]"
```

---

## 🏗️ **Architecture**

### **Cloud Infrastructure:**
- **FastMCP Cloud** hosts the server at `brand-asset-server.fastmcp.app`
- **Auto-deployment** from GitHub main branch
- **Auto-discovery** generates metadata from file structure
- **60+ assets** across 8+ products served via API

### **Local Development:**
- **Auto-discovery script** (`generate_metadata.py`) scans directories
- **Intelligent parsing** of filename conventions
- **GitHub integration** for asset URLs
- **Brand guidelines** embedded in responses

---

## 📋 **Key Files**

### **Production (Keep These):**
- `server.py` - **Active cloud server** ⭐
- `ciq_brand_assets_fastmcp.py` - Local development server
- `generate_metadata.py` - **Essential auto-discovery** ⭐
- `TEAM_SETUP.md` - **Team configuration guide** ⭐

### **Asset Structure:**
- `CIQ-logos/` - Company brand assets
- `Fuzzball-logos/`, `Warewulf-Pro-logos/`, etc. - Product assets
- `metadata/` - Auto-generated inventory

---

## 🎉 **Team Benefits**

### **For Designers:**
- ✅ **Instant access** to all brand assets through conversation
- ✅ **Smart recommendations** based on use case
- ✅ **Brand compliance** automatically enforced
- ✅ **Always current** assets via cloud deployment

### **For Administrators:**
- ✅ **Auto-discovery** - no manual metadata editing
- ✅ **Auto-deployment** - push to GitHub = instant team updates
- ✅ **Scalable** - unlimited products/assets supported
- ✅ **Zero server management** - FastMCP Cloud handles infrastructure

---

**🚀 Your team now has enterprise-grade brand asset delivery through natural language!**

For questions or issues, see `TEAM_SETUP.md` or contact the repository administrator.
