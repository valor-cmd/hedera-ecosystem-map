# Blockchain Ecosystem Map Template

**Version:** 1.0
**Last Updated:** January 18, 2026
**Based on:** Hedera Ecosystem Map by Genfinity

This document provides a comprehensive guide for creating visual ecosystem maps for blockchain networks. It captures all technical specifications, design patterns, and research methodologies used in the Hedera Ecosystem Map project.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Canvas and Layout Specifications](#canvas-and-layout-specifications)
4. [Section Structure](#section-structure)
5. [CSS Theming and Variables](#css-theming-and-variables)
6. [Hover Effects and Timing](#hover-effects-and-timing)
7. [Search Functionality](#search-functionality)
8. [Logo Guidelines](#logo-guidelines)
9. [Data Format (CSV)](#data-format-csv)
10. [Build Process](#build-process)
11. [Mobile Responsiveness](#mobile-responsiveness)
12. [Research Methodology](#research-methodology)
13. [Step-by-Step Guide for New Networks](#step-by-step-guide-for-new-networks)

---

## Overview

This ecosystem map is a single-page interactive SVG visualization that displays all projects, organizations, and services within a blockchain ecosystem. It features:

- **Desktop:** Full HD (1920x1080) interactive SVG with hover states, click-to-expand modals, and search
- **Mobile:** Responsive grid layout with collapsible sections
- **Search:** Real-time entity search with pulse animation highlighting
- **Branding:** Customizable branding placement (footer logo)

---

## Project Structure

```
[network]-ecosystem-map/
├── data/
│   └── [network]_ecosystem_master.csv    # Master data file
├── dist/
│   ├── [network]-map.svg                 # Generated SVG (desktop)
│   ├── [network]-map.html                # HTML template
│   └── [network]-ecosystem.html          # Final output (embeds SVG + mobile)
├── logos/
│   ├── wallets/                          # Wallet logos
│   ├── exchanges/                        # Exchange logos
│   ├── custodians/                       # Custodian logos
│   ├── defi/                            # DeFi project logos
│   ├── nft-markets/                     # NFT marketplace logos
│   ├── rwas/                            # Real world asset logos
│   ├── meme/                            # Meme token logos
│   ├── entertainment/                   # Gaming/entertainment logos
│   ├── infrastructure/                  # Infrastructure/services logos
│   ├── council/                         # Governance council member logos
│   ├── core/                            # Core organization logos (full size)
│   ├── branding/                        # Your branding logo
│   └── archive/                         # Unused/backup logos
├── src/
│   ├── render.js                        # SVG generation script
│   ├── build-html.js                    # HTML compilation script
│   └── theme-[name].css                 # CSS theme file
└── package.json
```

---

## Canvas and Layout Specifications

### Canvas Dimensions

```javascript
const W = 1920;  // HD width
const H = 1080;  // HD height
```

### Margin and Spacing Constants

```javascript
// Layout margins
const leftMargin = 50;    // Left edge padding (shifted for visual balance)
const rightMargin = 70;   // Right edge padding

// Vertical spacing
const contentY = 110;     // Y position where content starts (below title)
const footerSpace = 85;   // Bottom padding for footer

// Section spacing
const rowGap = 28;        // Vertical space between rows (for titles)
const gap = 8;            // Horizontal gap between sections
```

### Logo and Cell Dimensions

```javascript
// Standard section logos
const LOGO_SIZE = 40;       // Logo diameter
const CELL_WIDTH = 60;      // Cell width for logo + label
const CELL_HEIGHT = 70;     // Cell height
const PANEL_PAD = 20;       // Padding inside panels

// Council logos (rectangular)
const COUNCIL_LOGO_W = 100;
const COUNCIL_LOGO_H = 40;
const COUNCIL_CELL_W = 110;
const COUNCIL_CELL_H = 50;

// Core organization logos
const CORE_ORG_LOGO_W = 120;
const CORE_ORG_LOGO_H = 36;
```

### 4-Row Layout Distribution

The left side of the map uses 4 rows, with the right side reserved for special sections:

```
+----------------------------------------------------------------------+
| TITLE: "An Incomplete Map of the [Network] Ecosystem"                |
+----------------------------------------------------------------------+
| ROW 1: Wallets (22%) | Custodians (12%) | Exchanges (66%)   | COUNCIL|
+----------------------------------------------------------------------+
| ROW 2: Oracles | Bridges | Services | Onramps | Partners    | COUNCIL|
|        (8%)    | (16%)   | (32%)    | (14%)   | (30%)       | (2 col)|
+----------------------------------------------------------------------+
| ROW 3: Advisory | Risk  | Stable  | Tooling | Meme Tokens  | CORE   |
|        (7%)     | (17%) | (10%)   | (31%)   | (35%)        | ORGS   |
+----------------------------------------------------------------------+
| ROW 4: DeFi (30%) | NFTs (10%) | Gaming (28%) | RWAs (32%) | NATIVE |
|                   |            |               |            | SVCS   |
+----------------------------------------------------------------------+
| FOOTER: Data date | Note text                   | [Branding Logo]   |
+----------------------------------------------------------------------+
```

### Right Sidebar Dimensions

```javascript
const councilW = 320;     // Council section width (2-column layout)
const coreOrgsW = 180;    // Core Orgs + Native Services width
const rightSectionW = councilW + coreOrgsW + gap;  // Total right sidebar

// Vertical distribution
const councilH = H - contentY - footerSpace;           // Full height
const coreOrgsH = (councilH - rowGap) * 0.65;          // 65% for Core Orgs
const nativeH = councilH - coreOrgsH - rowGap;         // 35% for Native Services
```

---

## Section Structure

### Standard Sections (20 total)

Each section has:
- **Name:** Display title
- **Subcategories:** Types of entities within the section

```javascript
const SECTIONS = [
  // Row 1
  { name: "Wallets", subcategories: ["Wallet"] },
  { name: "Custodians", subcategories: ["Custodian"] },
  { name: "Exchanges", subcategories: ["Exchange"] },

  // Row 2
  { name: "Oracles", subcategories: ["Oracle"] },
  { name: "Bridges and Interoperability", subcategories: ["Bridge", "Interoperability"] },
  { name: "Services", subcategories: ["Infrastructure", "API Provider"] },
  { name: "Onramps", subcategories: ["Onramp"] },
  { name: "Implementation Partners", subcategories: ["Partner"] },

  // Row 3
  { name: "Advisory Firms", subcategories: ["Advisor"] },
  { name: "Risk and Compliance", subcategories: ["Compliance"] },
  { name: "Stablecoin Infrastructure", subcategories: ["Stablecoin"] },
  { name: "Tooling and Solutions", subcategories: ["Tooling"] },
  { name: "Meme Tokens", subcategories: ["Meme Token"] },

  // Row 4
  { name: "DeFi", subcategories: ["DEX", "Lending", "Staking", "Suite"] },
  { name: "NFT Markets", subcategories: ["NFT Platform", "NFT Marketplace"] },
  { name: "Gaming & ENT", subcategories: ["Gaming", "Music"] },
  { name: "Real World Assets", subcategories: ["Commodities", "Real Estate", "Carbon Credits", "Security Tokens", "RWA DeFi", "Exchange", "Environmental"] },

  // Right Sidebar
  { name: "[Network] Council", subcategories: ["Council Member"] },
  { name: "Independent Core Organizations", subcategories: ["Core Organization"] },
  { name: "Native Services", subcategories: ["Native Service"] }
];
```

### Section Width Allocation (Percentage of Left Area)

**Row 1:**
- Wallets: 22%
- Custodians: 12%
- Exchanges: Remainder (~66%)

**Row 2:**
- Oracles: 8%
- Bridges: 16%
- Services: 32%
- Onramps: 14%
- Partners: Remainder (~30%)

**Row 3:**
- Advisory: 7%
- Risk: 17%
- Stablecoin: 10%
- Tooling: 31%
- Meme: Remainder (~35%)

**Row 4:**
- DeFi: 30%
- NFTs: 10%
- Gaming: 28%
- RWAs: Remainder (~32%)

---

## CSS Theming and Variables

### Theme File: `theme-[name].css`

```css
:root {
  /* Background colors */
  --bg0: #000000;                          /* Primary background */
  --bg1: #000000;                          /* Secondary background */

  /* Accent colors - customize per network */
  --purple: #8b5cf6;                       /* Primary accent (Hedera purple) */
  --panel: rgba(139, 92, 246, 0.05);       /* Panel fill (5% opacity) */
  --panel2: rgba(139, 92, 246, 0.1);       /* Hover panel fill (10% opacity) */
  --stroke: #8b5cf6;                       /* Border/stroke color */

  /* Text colors */
  --text: #ffffff;                         /* Primary text */
  --muted: #c4b5fd;                        /* Secondary/muted text */
  --accent: #8b5cf6;                       /* Accent text */

  /* Badge colors (for tier indicators) */
  --badgeOfficial: #2a7fff;
  --badgeCommunity: #6b7cff;
  --badgeMeme: #8b6cff;

  /* Border radius */
  --radius: 22px;

  /* Shadow */
  --shadow: 0 18px 40px rgba(0, 0, 0, 0.45);

  /* Typography sizes */
  --titleSize: 30px;
  --subtitleSize: 16px;
  --sectionTitleSize: 10px;
  --subcategorySize: 8px;
  --itemSize: 7px;

  /* Logo dimensions */
  --logoSize: 56px;
  --logoRadius: 28px;
}
```

### Key CSS Classes

```css
/* Section panel */
.panel {
  fill: var(--panel);
  stroke: var(--stroke);
  stroke-width: 1;
  rx: 12;
  ry: 12;
}

/* Solid black on hover */
.section-group:hover .panel {
  fill: #000000 !important;
}

/* Section title */
.section-title {
  font-size: var(--sectionTitleSize);
  font-weight: 700;
  fill: var(--accent);
  cursor: pointer;
  transition: fill 0.2s ease;
}

/* Logo circle border */
.logo-circle {
  fill: rgba(0, 0, 0, 0.6);
  stroke: var(--purple);
  stroke-width: 1;
  cursor: pointer;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.logo-circle:hover {
  stroke: #ffffff;
  stroke-width: 2;
}

/* Logo label text */
.logo-label {
  font-size: var(--itemSize);
  fill: var(--text);
  font-weight: 500;
  text-anchor: middle;
}
```

---

## Hover Effects and Timing

### Hover Activation Delay

```javascript
// Delay before hover state activates (prevents accidental triggers)
const HOVER_DELAY = 250;  // milliseconds (0.25 seconds)

state.timeout = setTimeout(activateHover, 250);
```

### Hover Scale Effect

```javascript
// Maximum scale factor for hover expansion
const maxScale = Math.min(maxScaleX, maxScaleY, 1.8);  // Cap at 180%

// Scale is calculated based on available space to boundaries
// Prevents sections from overlapping edges
```

### Council Section Special Hover

The Council section has a unique hover behavior:
- **Normal state:** 2 columns of logos
- **Hover state:** Expands to 5 columns with 2x larger logos
- Expands **leftward** from the right edge

```javascript
// Council hover expansion
const hoverCols = 5;
const hoverLogoBaseHeight = 100;  // 2x normal size (50px)
const hoverCellW = 200;
const hoverPanelW = hoverCols * hoverCellW + innerPad * 2;  // ~1016px
```

### Transition Timing

```css
/* Section hover transition */
.section-group {
  transition: transform 0.3s ease;
}

/* Council layout transitions */
.council-normal,
.council-hover {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
```

---

## Search Functionality

### Search Behavior

1. User types in search bar
2. On Enter or button click, search executes
3. **If found:** "Confirmed on the Map" (green), logo pulses
4. **If not found:** "Not on the map yet" (red)
5. Section auto-expands to hover state when entity found (desktop)
6. Logo pulses for 10 seconds

### Search Aliases

```javascript
const searchAliases = {
  'aberdeen': 'abrdn',
  'aberdeen standard': 'abrdn',
  'hash name service': 'HNS',
  'hashname': 'Hashgraph.Name',
  'hash names': 'Hashgraph.Name',
  'hedera name service': 'HNS'
};
```

### Pulse Animation

```css
@keyframes logo-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.logo-pulsing {
  animation: logo-pulse 0.8s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center center;
}
```

---

## Logo Guidelines

### File Formats (in order of preference)

1. **SVG** - Best quality, scales perfectly
2. **PNG** - Good for complex logos with transparency
3. **JPG** - Acceptable for photos/complex images
4. **WebP** - Modern format, good compression

### Naming Convention

```
[EntityName]-CircleLogo.[ext]      # Standard circle logo
[EntityName]-CircleLogo_V1.[ext]   # Version variant
[Entity Name].[ext]                # Simple name (spaces allowed)
```

### Recommended Dimensions

- **Standard logos:** 200x200px minimum (displayed at 40px)
- **Council logos:** 400x160px (aspect ratio varies)
- **Core organization logos:** Full-width SVG preferred

### Folder Organization

```
logos/
├── wallets/           # Hot wallets, hardware wallets
├── custodians/        # Institutional custody
├── exchanges/         # CEX listings
├── oracles/           # Price feeds, data oracles
├── bridges/           # Cross-chain bridges
├── services/          # Infrastructure providers
├── onramps/           # Fiat on/off ramps
├── partners/          # Implementation partners
├── advisory/          # Advisory firms
├── compliance/        # Risk & compliance
├── stablecoin/        # Stablecoin infrastructure
├── tooling/           # Developer tools
├── defi/              # DeFi protocols
├── dexs/              # DEX-specific (can merge with defi)
├── nft-markets/       # NFT platforms
├── rwas/              # Real world assets
├── entertainment/     # Gaming, music
├── meme/              # Meme tokens
├── iot/               # IoT projects
├── infrastructure/    # General infrastructure
├── council/           # Governance council
├── core/              # Core organizations (full size)
└── branding/          # Your branding assets
```

---

## Data Format (CSV)

### Column Structure

```csv
Entity,Section,Type_or_Role,Tier,Status,Primary_Source,Website
```

### Field Definitions

| Field | Description | Example Values |
|-------|-------------|----------------|
| `Entity` | Display name | "SaucerSwap", "Hashgraph" |
| `Section` | CSV section name (mapped to display) | "Wallets", "DeFi", "Hedera Council" |
| `Type_or_Role` | Subcategory | "Wallet", "DEX", "Council Member" |
| `Tier` | Importance tier | "Tier 1", "Tier 2", "Tier 3" |
| `Status` | Current status | "Active", "Inactive", "Coming Soon" |
| `Primary_Source` | Where data came from | "hedera.com", "community" |
| `Website` | Official website URL | "https://saucerswap.finance" |

### Section Name Mapping

```javascript
const CSV_TO_SECTION = {
  "Wallets": "Wallets",
  "Custodians": "Custodians",
  "Exchanges": "Exchanges",
  "Oracles": "Oracles",
  "Bridges and Interoperability": "Bridges and Interoperability",
  "Services": "Services",
  "Onramps": "Onramps",
  "Implementation Partners": "Implementation Partners",
  "Advisory Firms": "Advisory Firms",
  "Risk and Compliance": "Risk and Compliance",
  "Stablecoin Infrastructure": "Stablecoin Infrastructure",
  "Tooling and Solutions": "Tooling and Solutions",
  "DeFi": "DeFi",
  "NFTs": "NFT Markets",           // Note: mapped differently
  "Real World Assets": "Real World Assets",
  "Gaming and Entertainment": "Gaming & ENT",  // Note: abbreviated
  "Hedera Council": "Hedera Council",
  "Independent Core Organizations": "Independent Core Organizations",
  "Meme Tokens": "Meme Tokens",
  "Native Services": "Native Services"
};
```

### Example Entries

```csv
SaucerSwap,DeFi,DEX,Tier 1,Active,saucerswap.finance,https://saucerswap.finance
Google,Hedera Council,Council Member,Tier 1,Active,hedera.com,https://google.com
Hedera Token Service,Native Services,Native Service,Tier 1,Active,hedera.com,https://hedera.com/token-service
```

---

## Build Process

### Dependencies

```json
{
  "dependencies": {
    "d3": "^7.x",
    "jsdom": "^22.x",
    "papaparse": "^5.x"
  }
}
```

### Build Commands

```bash
# Generate SVG from CSV data
npm run build:svg

# Generate final HTML (embeds SVG + mobile sections)
npm run build:html

# Full build
npm run build
```

### Build Steps

1. **render.js** reads CSV → generates SVG → writes to `dist/[network]-map.svg`
2. **build-html.js** reads:
   - HTML template (`dist/[network]-map.html`)
   - Generated SVG
   - CSV data for mobile sections
3. Outputs `dist/[network]-ecosystem.html`

### Logo Embedding

Logos are embedded as base64 data URIs for single-file distribution:

```javascript
function imageToDataUri(filePath) {
  const data = fs.readFileSync(filePath);
  if (ext === ".svg") {
    return `data:image/svg+xml;base64,${data.toString('base64')}`;
  }
  return `data:${mimeType};base64,${data.toString("base64")}`;
}
```

---

## Mobile Responsiveness

### Breakpoint

```css
/* Mobile: 768px and below */
@media (max-width: 768px) {
  .map-container { display: none !important; }
  .mobile-container { display: block; }
}

/* Desktop: 769px and above */
@media (min-width: 769px) {
  .mobile-container { display: none !important; }
}
```

### Mobile Grid Layout

```css
/* Standard sections: 5 logos per row */
.mobile-logos {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

/* Council/Core Orgs: 3 per row */
.mobile-section.council .mobile-logos,
.mobile-section.core-orgs .mobile-logos {
  grid-template-columns: repeat(3, 1fr);
}
```

### Mobile Logo Sizing

```css
.mobile-logo-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #8b5cf6;
}
```

---

## Research Methodology

### Primary Sources for Entity Discovery

1. **Official Network Sources**
   - Official ecosystem page (e.g., hedera.com/ecosystem)
   - Official blog announcements
   - Foundation grant recipients
   - Council/governance listings

2. **Developer Resources**
   - Network documentation
   - Developer portal integrations
   - SDK documentation partners

3. **DeFi/Trading Platforms**
   - DEX aggregators (DefiLlama, DappRadar)
   - CEX listing pages
   - Token tracking sites

4. **Community Sources**
   - Official Discord/Telegram
   - Reddit communities
   - Twitter/X ecosystem accounts

### Website Research Steps

For each entity, gather:

1. **Official Website**
   - Check if domain is active
   - Verify it's the correct/current URL
   - Note any redirects

2. **Social Links** (fallback if no website)
   - Twitter/X profile
   - Linktree
   - Documentation site

3. **Logo Acquisition**
   - Press kit / brand assets page
   - Twitter profile picture
   - Website favicon (upscale if needed)
   - Community-created (verify authenticity)

### Logo Research Checklist

```markdown
- [ ] Check official press kit
- [ ] Check brand guidelines page
- [ ] Download highest resolution available
- [ ] Verify logo is current (not outdated)
- [ ] Prefer SVG > PNG > JPG
- [ ] Ensure transparent background (if applicable)
- [ ] Verify you have rights to use the logo
```

### Categorization Guidelines

| If entity is... | Put in section... |
|-----------------|-------------------|
| A non-custodial wallet | Wallets |
| Provides cold storage for institutions | Custodians |
| CEX that lists the token | Exchanges |
| Provides price/data feeds | Oracles |
| Enables cross-chain transfers | Bridges and Interoperability |
| Provides RPC/nodes/APIs | Services |
| Enables fiat-to-crypto | Onramps |
| Builds custom solutions | Implementation Partners |
| Provides consulting | Advisory Firms |
| AML/KYC/compliance | Risk and Compliance |
| Stablecoin creation/management | Stablecoin Infrastructure |
| Developer tools/SDKs | Tooling and Solutions |
| AMM/DEX/lending/staking | DeFi |
| NFT marketplace or platform | NFT Markets |
| Gaming, music, entertainment | Gaming & ENT |
| Tokenized real assets | Real World Assets |
| Community meme tokens | Meme Tokens |
| Governance council member | [Network] Council |
| Foundation/core dev team | Independent Core Organizations |
| Native blockchain service | Native Services |

---

## Step-by-Step Guide for New Networks

### Phase 1: Project Setup

1. **Clone/copy the template structure**
   ```bash
   cp -r hedera-ecosystem-map [network]-ecosystem-map
   cd [network]-ecosystem-map
   ```

2. **Rename files**
   - `hedera_ecosystem_master.csv` → `[network]_ecosystem_master.csv`
   - `hedera-map.svg` → `[network]-map.svg`
   - `hedera-map.html` → `[network]-map.html`
   - `hedera-ecosystem.html` → `[network]-ecosystem.html`

3. **Update paths in code**
   - `render.js`: CSV_PATH, OUT_SVG
   - `build-html.js`: All file paths

4. **Choose theme colors**
   - Create `theme-[network].css`
   - Update `--purple` to network's brand color
   - Update all color variables

### Phase 2: Data Collection

1. **Research official sources**
   - Find official ecosystem page
   - Download council/partner lists
   - Note all official integrations

2. **Create initial CSV**
   - Start with Tier 1 (most important)
   - Add council members first
   - Add major exchanges
   - Add popular wallets

3. **Expand to Tier 2/3**
   - DeFi protocols
   - NFT platforms
   - Developer tools
   - Community projects

### Phase 3: Logo Collection

1. **Create folder structure** (see [Logo Guidelines](#logo-guidelines))

2. **Download logos systematically**
   - Council logos first
   - Core organizations
   - Then by section

3. **Process logos**
   - Rename to standard format
   - Convert to preferred format if needed
   - Verify all logos display correctly

### Phase 4: Build and Test

1. **Update logo mappings in render.js**
   ```javascript
   const specialMappings = {
     "Entity Name": path.join(LOGOS_PATH, "folder", "filename.ext"),
     // ... add all entities
   };
   ```

2. **Build SVG**
   ```bash
   npm run build:svg
   ```

3. **Test in browser**
   - Check all logos display
   - Verify hover effects work
   - Test search functionality
   - Test mobile view

4. **Iterate**
   - Adjust section widths if needed
   - Fix any missing logos
   - Update data for accuracy

### Phase 5: Finalize

1. **Update title in render.js**
   ```javascript
   .text("An Incomplete Map of the [Network] Ecosystem");
   ```

2. **Update footer date**
   - Automatically uses current date

3. **Add branding logo**
   - Place in `logos/branding/`
   - Update path in render.js

4. **Final build**
   ```bash
   npm run build
   ```

5. **Deploy**
   - Copy `dist/[network]-ecosystem.html` to hosting
   - Or push to GitHub Pages

---

## Quick Reference

### Key Files to Modify

| File | Purpose |
|------|---------|
| `data/[network]_ecosystem_master.csv` | All entity data |
| `src/render.js` | SVG generation, logo mappings, layout |
| `src/build-html.js` | Mobile logo mappings |
| `src/theme-[name].css` | Colors, typography, styling |
| `dist/[network]-map.html` | HTML template, JavaScript behavior |

### Key Constants to Customize

| Constant | File | Purpose |
|----------|------|---------|
| `leftMargin`, `rightMargin` | render.js | Canvas edge spacing |
| `HOVER_DELAY` (250ms) | hedera-map.html | Hover activation delay |
| `--purple` | theme.css | Primary accent color |
| `SECTIONS` | render.js | Section definitions |
| `searchAliases` | hedera-map.html | Search term mappings |

### Common Customizations

1. **Change accent color:** Edit `--purple` and related variables in theme CSS
2. **Add new section:** Add to SECTIONS array, create matching subcategories
3. **Adjust section width:** Modify percentage allocation in render.js
4. **Change hover delay:** Edit `setTimeout` value in HTML JavaScript
5. **Add search alias:** Add to `searchAliases` object in HTML

---

## Branding Credits

**Original Design:** Genfinity (https://genfinity.io)
**Hedera Ecosystem Map:** https://hedera-data-app.vercel.app

When creating maps for other networks, please credit:
- Original template design by Genfinity
- Adapted from the Hedera Ecosystem Map project

---

*This template is designed to be comprehensive and self-contained. Following this guide should enable rapid creation of ecosystem maps for any blockchain network.*
