import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import * as d3 from "d3";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;

const ROOT = process.cwd();
const CSV_PATH = path.join(ROOT, "data", "hedera_ecosystem_master.csv");
const CSS_PATH = path.join(ROOT, "src", "theme-genfinity.css");
const OUT_SVG = path.join(ROOT, "dist", "hedera-map.svg");
const LOGOS_PATH = path.join(ROOT, "logos");

const W = 1920;  // HD width
const H = 1080;  // HD height

// Layout config - compact for 1920x1080
const LOGO_SIZE = 40;  // Compact size
const CELL_WIDTH = 60;  // Compact size
const CELL_HEIGHT = 70;  // Compact size
const PANEL_PAD = 20;
const CLUSTER_GAP = 50;  // More gap between clusters
const SUBTITLE_GAP = 25;  // Gap between subtitle and logos
const TITLE_HEIGHT = 80;  // Space for 2.7x bigger title above box

// Council logo dimensions - compact for vertical layout
const COUNCIL_LOGO_W = 100;
const COUNCIL_LOGO_H = 40;
const COUNCIL_CELL_W = 110;
const COUNCIL_CELL_H = 50;

// Core Organizations logo dimensions - compact
const CORE_ORG_LOGO_W = 120;
const CORE_ORG_LOGO_H = 36;
const CORE_ORG_CELL_W = 200;

// Sections config - using Hedera ecosystem naming convention from hedera.com/ecosystem
const SECTIONS = [
  { name: "Wallets", subcategories: ["Wallet"] },
  { name: "Custodians", subcategories: ["Custodian"] },
  { name: "Exchanges", subcategories: ["Exchange"] },
  { name: "Oracles", subcategories: ["Oracle"] },
  { name: "Bridges and Interoperability", subcategories: ["Bridge", "Interoperability"] },
  { name: "Services", subcategories: ["Infrastructure", "API Provider"] },
  { name: "Onramps", subcategories: ["Onramp"] },
  { name: "Implementation Partners", subcategories: ["Partner"] },
  { name: "Advisory Firms", subcategories: ["Advisor"] },
  { name: "Risk and Compliance", subcategories: ["Compliance"] },
  { name: "Stablecoin Infrastructure", subcategories: ["Stablecoin"] },
  { name: "Tooling and Solutions", subcategories: ["Tooling"] },
  { name: "DeFi", subcategories: ["DEX", "Lending", "Staking", "Suite"] },
  { name: "NFT Markets", subcategories: ["NFT Platform", "NFT Marketplace"] },
  { name: "Real World Assets", subcategories: ["Commodities", "Real Estate", "Carbon Credits", "Security Tokens", "RWA DeFi", "Exchange", "Environmental"] },
  { name: "Gaming & ENT", subcategories: ["Gaming", "Music"] },
  { name: "Hedera Council", subcategories: ["Council Member"] },
  { name: "Independent Core Organizations", subcategories: ["Core Organization"] },
  { name: "Meme Tokens", subcategories: ["Meme Token"] },
  { name: "Native Services", subcategories: ["Native Service"] }
];

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
  "NFTs": "NFT Markets",
  "Real World Assets": "Real World Assets",
  "Gaming and Entertainment": "Gaming & ENT",
  "Hedera Council": "Hedera Council",
  "Independent Core Organizations": "Independent Core Organizations",
  "Meme Tokens": "Meme Tokens",
  "Native Services": "Native Services"
};

// Logo file finder
function findLogoFile(entityName) {
  const specialMappings = {
    // Wallets (from wallets folder)
    "HashPack": path.join(LOGOS_PATH, "wallets", "HashPack-CircleLogo_V1.svg"),
    "Kabila": path.join(LOGOS_PATH, "wallets", "Kabila-CircleLogo.svg"),
    "Wallawallet": path.join(LOGOS_PATH, "wallets", "wallawallet.jpg"),
    "Citadel Wallet": path.join(LOGOS_PATH, "wallets", "CitadelWallet-CircleLogo.png.webp"),
    "Exodus": path.join(LOGOS_PATH, "wallets", "Exodus-CircleLogo.svg"),
    "D'CENT": path.join(LOGOS_PATH, "wallets", "DCENT-CircleLogo.svg"),
    "Atomic Wallet": path.join(LOGOS_PATH, "wallets", "AtomicWallet-CircleLogo.svg"),
    "Guarda": path.join(LOGOS_PATH, "wallets", "Guarda-CircleLogo.svg"),
    "Dfns": path.join(LOGOS_PATH, "wallets", "Dfns-CircleLogo.svg"),
    "MetaMask Wallet Snap": path.join(LOGOS_PATH, "wallets", "MetaMask_Wallet_Snap-CircleLogo.png.webp"),
    "Venly": path.join(LOGOS_PATH, "wallets", "Venly-CircleLogo.svg"),
    "WalletConnect": path.join(LOGOS_PATH, "wallets", "WalletConnect-CircleLogo.svg"),
    // Custodians
    "BitGo": path.join(LOGOS_PATH, "Custodians", "BitGo-CircleLogo.svg"),
    "Fireblocks": path.join(LOGOS_PATH, "Custodians", "Fireblocks-CircleLogo.svg"),
    "Hex Trust": path.join(LOGOS_PATH, "Custodians", "HexTrust-CircleLogo.svg"),
    "Ledger": path.join(LOGOS_PATH, "Custodians", "Ledger-CircleLogo.svg"),
    "Anchorage Digital": path.join(LOGOS_PATH, "Custodians", "AnchorageDigital-CircleLogo.svg"),
    "Copper": path.join(LOGOS_PATH, "Custodians", "Copper-CircleLogo.svg"),
    // Exchanges
    "Binance": path.join(LOGOS_PATH, "Exchanges", "Binance-CircleLogo.svg"),
    "Coinbase": path.join(LOGOS_PATH, "Exchanges", "Coinbase-CircleLogo.svg"),
    "Kraken": path.join(LOGOS_PATH, "Exchanges", "Kraken-CircleLogo.svg"),
    "KuCoin": path.join(LOGOS_PATH, "Exchanges", "KuCoin-CircleLogo.svg"),
    "Bybit": path.join(LOGOS_PATH, "Exchanges", "Bybit-CircleLogo.svg"),
    "Gate.io": path.join(LOGOS_PATH, "Exchanges", "Gate_io-CircleLogo.svg"),
    "Crypto.com": path.join(LOGOS_PATH, "Exchanges", "Crypto_com-CircleLogo.svg"),
    "HTX": path.join(LOGOS_PATH, "Exchanges", "HTX-CircleLogo.svg"),
    "MEXC": path.join(LOGOS_PATH, "Exchanges", "MEXC-CircleLogo.svg"),
    "Bitvavo": path.join(LOGOS_PATH, "Exchanges", "Bitvavo-CircleLogo.svg"),
    "Robinhood": path.join(LOGOS_PATH, "Exchanges", "Robinhood-CircleLogo.svg"),
    "BitMart": path.join(LOGOS_PATH, "Exchanges", "BitMart-CircleLogo.svg"),
    "LBank": path.join(LOGOS_PATH, "Exchanges", "LBank-CircleLogo.svg"),
    "WhiteBit": path.join(LOGOS_PATH, "Exchanges", "WhiteBit-CircleLogo.svg"),
    "BTCC": path.join(LOGOS_PATH, "Exchanges", "BTCC-CircleLogo.svg"),
    "Bingx": path.join(LOGOS_PATH, "Exchanges", "Bingx-CircleLogo.svg"),
    "Bit2Me": path.join(LOGOS_PATH, "Exchanges", "Bit2Me-CircleLogo.svg"),
    "BitGet": path.join(LOGOS_PATH, "Exchanges", "BitGet-CircleLogo.png"),
    "Bithumb": path.join(LOGOS_PATH, "Exchanges", "Bithumb-CircleLogo.png"),
    "Bitrue": path.join(LOGOS_PATH, "Exchanges", "Bitrue-CircleLogo.png.webp"),
    "DigiFinex": path.join(LOGOS_PATH, "Exchanges", "DigiFinex-CircleLogo.svg"),
    "FMFW": path.join(LOGOS_PATH, "Exchanges", "FMFW-CircleLogo.svg"),
    "HiBT": path.join(LOGOS_PATH, "Exchanges", "HiBT-CircleLogo.png.webp"),
    "HitBTC": path.join(LOGOS_PATH, "Exchanges", "HitBTC-CircleLogo.svg"),
    "Hotcoin": path.join(LOGOS_PATH, "Exchanges", "Hotcoin-CircleLogo.png"),
    "KCEX": path.join(LOGOS_PATH, "Exchanges", "KCEX-CircleLogo.png.webp"),
    "TooBit": path.join(LOGOS_PATH, "Exchanges", "TooBit-CircleLogo.svg"),
    "XT": path.join(LOGOS_PATH, "Exchanges", "XT-CircleLogo.png"),
    // Oracles
    "Chainlink": path.join(LOGOS_PATH, "Oracles", "Chainlink-CircleLogo.svg"),
    "Pyth": path.join(LOGOS_PATH, "Oracles", "Pyth-CircleLogo.svg"),
    "Supra": path.join(LOGOS_PATH, "Oracles", "Supra-CircleLogo.svg"),
    // Bridges and Interoperability
    "Hashport": path.join(LOGOS_PATH, "Bridges and Interoperability", "Hashport-CircleLogo.svg"),
    "Axelar": path.join(LOGOS_PATH, "Bridges and Interoperability", "Axelar-CircleLogo.svg"),
    "LayerZero": path.join(LOGOS_PATH, "Bridges and Interoperability", "LayerZero-CircleLogo.svg"),
    "Stargate Finance": path.join(LOGOS_PATH, "Bridges and Interoperability", "StargateFinance-CircleLogo_V1.png"),
    "Ownera": path.join(LOGOS_PATH, "Bridges and Interoperability", "Ownera-CircleLogo_V1.png"),
    "XP Network": path.join(LOGOS_PATH, "Bridges and Interoperability", "XP_Network-CircleLogo.png"),
    // Services
    "Arkhia": path.join(LOGOS_PATH, "Services", "Arkhia-CircleLogo.png"),
    "Hgraph": path.join(LOGOS_PATH, "Services", "HGraph-CircleLogo.png"),
    "Validation Cloud": path.join(LOGOS_PATH, "Services", "ValidationCloud-CircleLogo.svg"),
    "QuickNode": path.join(LOGOS_PATH, "Services", "QuickNode-CircleLogo.svg"),
    "LinkPool": path.join(LOGOS_PATH, "Services", "LinkPool-CircleLogo.svg"),
    "Buidler Labs": path.join(LOGOS_PATH, "Services", "BuidlerLabs-CircleLogo.png.webp"),
    "Envision Blockchain": path.join(LOGOS_PATH, "Services", "EnvisionBlockchain-CircleLogo.svg"),
    "The Binary Holdings": path.join(LOGOS_PATH, "Services", "TheBinaryHoldings-CircleLogo.png.webp"),
    // Onramps
    "Banxa": path.join(LOGOS_PATH, "Onramps", "Banxa-CircleLogo.svg"),
    "MoonPay": path.join(LOGOS_PATH, "Onramps", "MoonPay-CircleLogo.svg"),
    "Transak": path.join(LOGOS_PATH, "Onramps", "Transak-CircleLogo.svg"),
    "C14": path.join(LOGOS_PATH, "Onramps", "C14-CircleLogo.png.webp"),
    "Metallicius": path.join(LOGOS_PATH, "Onramps", "Metallicius-CircleLogo.png.webp"),
    // Implementation Partners
    "LimeChain": path.join(LOGOS_PATH, "Implementation Partners", "Limechain-CircleLogo.svg"),
    "ioBuilders": path.join(LOGOS_PATH, "Implementation Partners", "ioBuilders-CircleLogo.svg"),
    "IntellectEU": path.join(LOGOS_PATH, "Implementation Partners", "IntellectEU-CircleLogo.svg"),
    "Lab49": path.join(LOGOS_PATH, "Implementation Partners", "Lab49-CircleLogo.svg"),
    "Object Computing": path.join(LOGOS_PATH, "Implementation Partners", "ObjectComputing-CircleLogo.svg"),
    "BCW": path.join(LOGOS_PATH, "Implementation Partners", "BCW-CircleLogo.svg"),
    "Seisan": path.join(LOGOS_PATH, "Implementation Partners", "Seisan-CircleLogo.png.webp"),
    "Unicsoft": path.join(LOGOS_PATH, "Implementation Partners", "Unicsoft-CircleLogo.svg"),
    "VMO Holdings": path.join(LOGOS_PATH, "Implementation Partners", "VMO_Holdings-CircleLogo.png"),
    "Varmeta": path.join(LOGOS_PATH, "Implementation Partners", "Varmeta-CircleLogo.svg"),
    "Web3Genes": path.join(LOGOS_PATH, "Implementation Partners", "Web3Genes-CircleLogo.png"),
    // Advisory Firms
    "Accenture": path.join(LOGOS_PATH, "Advisory Firms", "Accenture-CircleLogo.svg"),
    "NTT Data": path.join(LOGOS_PATH, "Advisory Firms", "NTT_Data-CircleLogo.svg"),
    // Risk and Compliance
    "TRM Labs": path.join(LOGOS_PATH, "Risk and Compliance", "TRM-CircleLogo.svg"),
    "Elliptic": path.join(LOGOS_PATH, "Risk and Compliance", "Elliptic-CircleLogo.svg"),
    "Merkle Science": path.join(LOGOS_PATH, "Risk and Compliance", "Merkle_Science-CircleLogo.svg"),
    "Chainabuse": path.join(LOGOS_PATH, "Risk and Compliance", "Chainabuse-CircleLogo.svg"),
    "Fortress": path.join(LOGOS_PATH, "Risk and Compliance", "Fortress-CircleLogo.svg"),
    // Stablecoin Infrastructure
    "Brale": path.join(LOGOS_PATH, "Stablecoin Infrastructure", "Brale_xyz-CircleLogo.svg"),
    "Ichi": path.join(LOGOS_PATH, "Stablecoin Infrastructure", "Ichi-CircleLogo.svg"),
    "Ubyx": path.join(LOGOS_PATH, "Stablecoin Infrastructure", "Ubyx-CircleLogo.png.webp"),
    // Tooling and Solutions
    "The Graph": path.join(LOGOS_PATH, "Tooling and Solutions", "TheGraph-CircleLogo.svg"),
    "Joget": path.join(LOGOS_PATH, "Tooling and Solutions", "Joget-CircleLogo.svg"),
    "KiloScribe": path.join(LOGOS_PATH, "Tooling and Solutions", "KiloScribe-CircleLogo.png.webp"),
    "Hashgraph Online": path.join(LOGOS_PATH, "Tooling and Solutions", "Hashgraph Online.webp"),
    "Demia": path.join(LOGOS_PATH, "Tooling and Solutions", "Demia-CircleLogo.png.webp"),
    "StegX": path.join(LOGOS_PATH, "Tooling and Solutions", "StegX-CircleLogo.png"),
    "Tuum": path.join(LOGOS_PATH, "Tooling and Solutions", "Tuum-CircleLogo.svg"),
    "Turtle Moon": path.join(LOGOS_PATH, "Tooling and Solutions", "Turtle Moon.png"),
    "Neuron": path.join(LOGOS_PATH, "iot", "Neuron World.jpg"),
    // DeFi
    "SaucerSwap": path.join(LOGOS_PATH, "defi", "saucerswap.jpg"),
    "HeliSwap": path.join(LOGOS_PATH, "defi", "heliswap.jpg"),
    "Pangolin": path.join(LOGOS_PATH, "defi", "Pangolin.jpg"),
    "Bonzo Finance": path.join(LOGOS_PATH, "defi", "Bonzo Finance Labs.jpg"),
    "Stader Labs": path.join(LOGOS_PATH, "defi", "Stader Labs.jpg"),
    "Swarm Markets": path.join(LOGOS_PATH, "defi", "swarm-markets.jpg"),
    "Hsuite": path.join(LOGOS_PATH, "defi", "Hsuite.jpg"),
    "Diffuse Labs": path.join(LOGOS_PATH, "DEXs", "Diffuse Labs.jpg"),
    "ETA Swap": path.join(LOGOS_PATH, "DEXs", "ETA Swap.jpg"),
    "Memejob": path.join(LOGOS_PATH, "DEXs", "Memejob.jpg"),
    "Orbit": path.join(LOGOS_PATH, "DEXs", "Orbit.png"),
    "Silk Suite": path.join(LOGOS_PATH, "DEXs", "Silk Suite.jpg"),
    // NFTs
    "Hashinals": path.join(LOGOS_PATH, "NFT Markets", "hashinals.jpg"),
    "SentX": path.join(LOGOS_PATH, "NFT Markets", "sentx.jpg"),
    "Altlantis": path.join(LOGOS_PATH, "NFT Markets", "Altlantis.jpg"),
    // Real World Assets
    "Diamond Standard": path.join(LOGOS_PATH, "rwas", "diamond-standard.jpg"),
    "RedSwan": path.join(LOGOS_PATH, "rwas", "redswan.jpg"),
    "Dovu": path.join(LOGOS_PATH, "rwas", "dovu.jpg"),
    "Tokeny": path.join(LOGOS_PATH, "rwas", "tokeny.jpg"),
    "Zoniqx": path.join(LOGOS_PATH, "rwas", "zoniqx.jpg"),
    "Archax": path.join(LOGOS_PATH, "rwas", "archax.jpg"),
    "EcoGuard": path.join(LOGOS_PATH, "rwas", "Ecogard.jpg"),
    "Verra Guardian": path.join(LOGOS_PATH, "rwas", "Verra Guardian.jpg"),
    "Isle Finance": path.join(LOGOS_PATH, "rwas", "Isle Finance.jpg"),
    // Gaming and Entertainment
    "Moonscape": path.join(LOGOS_PATH, "entertainment", "Moonscape.jpg"),
    "Tune.fm": path.join(LOGOS_PATH, "entertainment", "Tune.fm.jpg"),
    "Earthlings Land": path.join(LOGOS_PATH, "entertainment", "Earthlings Land.jpg"),
    "Angry Roll": path.join(LOGOS_PATH, "entertainment", "Angry Roll.jpg"),
    "Hedera Coin Flip": path.join(LOGOS_PATH, "entertainment", "Hedera Coin Flip.png"),
    "Legends of the Past": path.join(LOGOS_PATH, "entertainment", "Legends of the past.jpg"),
    "Shibar": path.join(LOGOS_PATH, "entertainment", "Shibar.jpg"),
    "The Barking Game": path.join(LOGOS_PATH, "entertainment", "The Barking Game.jpg"),
    "Trade Games": path.join(LOGOS_PATH, "entertainment", "Trade Games.png"),
    "Skelly Bets": path.join(LOGOS_PATH, "entertainment", "skelly bets.jpg"),
    // Meme Tokens
    "Boring": path.join(LOGOS_PATH, "meme", "Boring.jpg"),
    "Dino": path.join(LOGOS_PATH, "meme", "Dino.png"),
    "Dosa": path.join(LOGOS_PATH, "meme", "Dosa.jpg"),
    "Gib": path.join(LOGOS_PATH, "meme", "Gib.jpg"),
    "Grelf": path.join(LOGOS_PATH, "meme", "Grelf.jpg"),
    "Hert": path.join(LOGOS_PATH, "meme", "Hert.png"),
    "Leemon": path.join(LOGOS_PATH, "meme", "Leemon.jpg"),
    "Sara": path.join(LOGOS_PATH, "meme", "Sara.jpg"),
    "Smackm": path.join(LOGOS_PATH, "meme", "Smackm.jpg"),
    "Soot": path.join(LOGOS_PATH, "meme", "Soot.jpg"),
    // Tooling (additional)
    "Hashgraph.Name": path.join(LOGOS_PATH, "DEXs", "HashNames.jpg"),
    // Additional Services (infrastructure folder)
    "EQTY Lab": path.join(LOGOS_PATH, "infrastructure", "EQTY Lab.jpg"),
    "Tashi Network": path.join(LOGOS_PATH, "infrastructure", "Tashi Network.jpg"),
    "HNS": path.join(LOGOS_PATH, "infrastructure", "HNS Hedera Naming Service.png"),
    "The Hashgraph Group": path.join(LOGOS_PATH, "infrastructure", "The Hashgraph Group.jpg"),
    // Core organizations (full size logos)
    "Hashgraph": path.join(LOGOS_PATH, "core", "Hashgraph full size.svg"),
    "Hashgraph Full": path.join(LOGOS_PATH, "core", "Hashgraph full size.svg"),
    "Hedera Council": path.join(LOGOS_PATH, "core", "Hedera Council full size.svg"),
    "Hedera Foundation": path.join(LOGOS_PATH, "core", "Hedera Foundation full size.svg"),
    "Hedera Foundation Full": path.join(LOGOS_PATH, "core", "Hedera Foundation full size.svg"),
    "The Hashgraph Association": path.join(LOGOS_PATH, "core", "The Hashgraph Assoication full size.svg"),
    "The Hashgraph Association Full": path.join(LOGOS_PATH, "core", "The Hashgraph Assoication full size.svg"),
    "Exponential Science": path.join(LOGOS_PATH, "core", "Exponetntial Science full size.svg"),
    "Exponential Science Full": path.join(LOGOS_PATH, "core", "Exponetntial Science full size.svg"),
    // Council members
    "Google": path.join(LOGOS_PATH, "council", "google-logo-box.svg"),
    "IBM": path.join(LOGOS_PATH, "council", "ibm.svg"),
    "Boeing": path.join(LOGOS_PATH, "council", "boeing.svg"),
    "Dell": path.join(LOGOS_PATH, "council", "dell.svg"),
    "Deutsche Telekom": path.join(LOGOS_PATH, "council", "deutsche-telekom.svg"),
    "LG Electronics": path.join(LOGOS_PATH, "council", "lg-electronics.svg"),
    "Nomura": path.join(LOGOS_PATH, "council", "nomura.svg"),
    "Ubisoft": path.join(LOGOS_PATH, "council", "ubisoft-logo-box.svg"),
    "UCL": path.join(LOGOS_PATH, "council", "university-college-london-ucl-seeklogo.svg"),
    "Shinhan Bank": path.join(LOGOS_PATH, "council", "shinhan-bank.svg"),
    "DLA Piper": path.join(LOGOS_PATH, "council", "dla-piper-logo-box.svg"),
    "EDF": path.join(LOGOS_PATH, "council", "edf-logo-box.svg"),
    "eftpos": path.join(LOGOS_PATH, "council", "eftpos.svg"),
    "Hitachi": path.join(LOGOS_PATH, "council", "hitachi.svg"),
    "Swirlds Labs": path.join(LOGOS_PATH, "council", "swirlds-labs.svg"),
    "Tata Communications": path.join(LOGOS_PATH, "council", "tata-communications.svg"),
    "Worldpay": path.join(LOGOS_PATH, "council", "Worldpay_logo_c_rgb.svg"),
    "LSE": path.join(LOGOS_PATH, "council", "lse.svg"),
    "abrdn": path.join(LOGOS_PATH, "council", "aberdeen-logo-box.svg"),
    "Mondelez": path.join(LOGOS_PATH, "council", "mondelez-logo-box.svg"),
    "ServiceNow": path.join(LOGOS_PATH, "council", "servicenow-logo-box.svg"),
    "Zain Group": path.join(LOGOS_PATH, "council", "zain-logo-box.svg"),
    "Arrow": path.join(LOGOS_PATH, "council", "arrow-logo-box.svg"),
    "Cofra": path.join(LOGOS_PATH, "council", "cofra-logo-box.svg"),
    "Dentons": path.join(LOGOS_PATH, "council", "dentons-logo-box.svg"),
    "IIT Madras": path.join(LOGOS_PATH, "council", "iit-madras-logo-box.svg"),
    "Magalu": path.join(LOGOS_PATH, "council", "magalu-logo-box.svg"),
    "Repsol": path.join(LOGOS_PATH, "council", "repsol-logo-white-flat.svg"),
    "Blockchain for Energy": path.join(LOGOS_PATH, "council", "blockchain-for-energy-logo-box.svg"),
    "GBBC": path.join(LOGOS_PATH, "council", "GBBClogo.png"),
  };

  if (specialMappings[entityName] && fs.existsSync(specialMappings[entityName])) {
    return specialMappings[entityName];
  }

  const extensions = [".jpg", ".png", ".svg", ".webp"];
  for (const ext of extensions) {
    const p = path.join(LOGOS_PATH, `${entityName}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function imageToDataUri(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  const data = fs.readFileSync(filePath);
  if (ext === ".svg") return { type: "svg", content: data.toString("utf8") };
  const mimeTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
  return { type: "image", dataUri: `data:${mimeTypes[ext] || "image/png"};base64,${data.toString("base64")}` };
}

function wrapText(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach(word => {
    if (!currentLine) currentLine = word;
    else if ((currentLine + ' ' + word).length <= maxCharsPerLine) currentLine += ' ' + word;
    else { lines.push(currentLine); currentLine = word; }
  });
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3);
}

function readCSV() {
  return Papa.parse(fs.readFileSync(CSV_PATH, "utf8"), { header: true, skipEmptyLines: true }).data;
}

function ensureDist() {
  fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
}

function buildSectionData(rows) {
  const result = {};
  SECTIONS.forEach(sec => {
    result[sec.name] = { subcategories: {} };
    sec.subcategories.forEach(sub => result[sec.name].subcategories[sub] = []);
  });

  rows.forEach(row => {
    const displaySection = CSV_TO_SECTION[row.Section];
    if (!displaySection || !result[displaySection]) return;
    const role = row.Type_or_Role?.trim() || "";
    const sectionDef = SECTIONS.find(s => s.name === displaySection);
    let targetSubcat = sectionDef?.subcategories.find(sub => sub === role || sub.toLowerCase() === role.toLowerCase()) || role;
    if (result[displaySection].subcategories[targetSubcat]) {
      result[displaySection].subcategories[targetSubcat].push({
        entity: row.Entity?.trim(), role, tier: row.Tier?.trim() || "",
        status: row.Status?.trim() || "", website: row.Website?.trim() || ""
      });
    }
  });
  return result;
}

function renderSVG(sectionData) {
  const css = fs.readFileSync(CSS_PATH, "utf8");
  const svg = d3.create("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
    .attr("width", W).attr("height", H)
    .attr("viewBox", `0 0 ${W} ${H}`);

  const defs = svg.append("defs");
  defs.append("style").attr("type", "text/css").text(css);

  svg.append("rect").attr("x", 0).attr("y", 0).attr("width", W).attr("height", H).attr("fill", "#000000");

  // Header - 50% smaller, moved up to make room for search bar
  svg.append("text").attr("class", "header-title")
    .attr("x", 40).attr("y", 50)
    .attr("font-size", "18px")
    .text("An Incomplete Map of the Hedera Ecosystem");

  const contentY = 110;  // 4x more top padding
  const panelMargin = 70;  // 4x more padding around edges
  const rowGap = 28;  // Space between rows for titles
  const gap = 8;  // More even spacing between sections

  // Layout fills full canvas width
  const footerSpace = 85;  // 4x more bottom padding

  // Right side: Council (2 cols) + Core Orgs/Native Services - WIDER
  const councilW = 320;  // Wider for 2 columns of council logos
  const coreOrgsW = 180;  // Wider for Core Orgs + Native Services
  const rightSectionW = councilW + coreOrgsW + gap;
  const leftAreaW = W - panelMargin * 2 - rightSectionW - gap;  // Narrower left area

  // Right side vertical panels - fill to edge
  const rightX = W - panelMargin - rightSectionW;
  const councilH = H - contentY - footerSpace;  // Full height for Council with bottom padding
  const coreOrgsH = (councilH - rowGap) * 0.65;  // 65% for Core Orgs, using rowGap for title space
  const nativeH = councilH - coreOrgsH - rowGap;  // Rest for Native Services, using rowGap for title space

  // Calculate row heights to fill vertical space (4 rows + footer)
  const availableHeight = H - contentY - footerSpace;
  const totalRowGaps = rowGap * 3;
  const rowH = Math.floor((availableHeight - totalRowGaps) / 4);

  // Row 1: 3 panels (left side) - Wallets wider, Exchanges narrower
  const row1Y = contentY;
  const row1H = rowH;
  const r1_wallets = Math.floor(leftAreaW * 0.22);  // Wider for wallets
  const r1_custodians = Math.floor(leftAreaW * 0.12);
  const r1_exchanges = leftAreaW - r1_wallets - r1_custodians - gap * 2;  // Narrower

  // Row 2: 5 panels - proportional to entity count (3, 6, 12, 5, 11 = 37 total)
  const row2Y = row1Y + row1H + rowGap;
  const row2H = rowH;
  const r2_oracles = Math.floor(leftAreaW * 0.08);    // 3 entities
  const r2_bridges = Math.floor(leftAreaW * 0.16);    // 6 entities
  const r2_services = Math.floor(leftAreaW * 0.32);   // 12 entities (was 20% - too cramped)
  const r2_onramps = Math.floor(leftAreaW * 0.14);    // 5 entities
  const r2_partners = leftAreaW - r2_oracles - r2_bridges - r2_services - r2_onramps - gap * 4;  // 11 entities (~30%)

  // Row 3: 5 panels - proportional to entity count (2, 5, 3, 9, 10 = 29 total)
  const row3Y = row2Y + row2H + rowGap;
  const row3H = rowH;
  const r3_advisory = Math.floor(leftAreaW * 0.07);   // 2 entities
  const r3_risk = Math.floor(leftAreaW * 0.17);       // 5 entities (was 14%)
  const r3_stablecoin = Math.floor(leftAreaW * 0.10); // 3 entities
  const r3_tooling = Math.floor(leftAreaW * 0.31);    // 9 entities (was 20% - too cramped)
  const r3_meme = leftAreaW - r3_advisory - r3_risk - r3_stablecoin - r3_tooling - gap * 4;  // 10 entities (~35%)

  // Row 4: 4 panels (DeFi, NFTs, Gaming & ENT, Real World Assets) - adjusted for 12 DeFi + 10 Gaming
  const row4Y = row3Y + row3H + rowGap;
  const row4H = rowH;
  const r4_defi = Math.floor(leftAreaW * 0.30);  // Larger for 12 DeFi entities
  const r4_nfts = Math.floor(leftAreaW * 0.10);  // Smaller, only 3 NFT entities
  const r4_gaming = Math.floor(leftAreaW * 0.28);  // Much larger for 10 gaming entities
  const r4_rwas = leftAreaW - r4_defi - r4_nfts - r4_gaming - gap * 3;  // ~32% for 9 RWA entities

  const panels = [
    // Row 1: Wallets, Custodians, Exchanges (left side)
    { section: "Wallets", x: panelMargin, y: row1Y, w: r1_wallets, h: row1H, alignLeft: true, alignTop: true },
    { section: "Custodians", x: panelMargin + r1_wallets + gap, y: row1Y, w: r1_custodians, h: row1H, alignTop: true },
    { section: "Exchanges", x: panelMargin + r1_wallets + gap + r1_custodians + gap, y: row1Y, w: r1_exchanges, h: row1H, alignTop: true },

    // Row 2: Oracles, Bridges, Services, Onramps, Implementation Partners
    { section: "Oracles", x: panelMargin, y: row2Y, w: r2_oracles, h: row2H, alignLeft: true, alignTop: true },
    { section: "Bridges and Interoperability", x: panelMargin + r2_oracles + gap, y: row2Y, w: r2_bridges, h: row2H, alignTop: true },
    { section: "Services", x: panelMargin + r2_oracles + gap + r2_bridges + gap, y: row2Y, w: r2_services, h: row2H, alignTop: true },
    { section: "Onramps", x: panelMargin + r2_oracles + gap + r2_bridges + gap + r2_services + gap, y: row2Y, w: r2_onramps, h: row2H, alignTop: true },
    { section: "Implementation Partners", x: panelMargin + r2_oracles + gap + r2_bridges + gap + r2_services + gap + r2_onramps + gap, y: row2Y, w: r2_partners, h: row2H, alignTop: true },

    // Row 3: Advisory, Risk, Stablecoin, Tooling, Meme Tokens
    { section: "Advisory Firms", x: panelMargin, y: row3Y, w: r3_advisory, h: row3H, alignLeft: true, alignTop: true },
    { section: "Risk and Compliance", x: panelMargin + r3_advisory + gap, y: row3Y, w: r3_risk, h: row3H, alignTop: true },
    { section: "Stablecoin Infrastructure", x: panelMargin + r3_advisory + gap + r3_risk + gap, y: row3Y, w: r3_stablecoin, h: row3H, alignTop: true },
    { section: "Tooling and Solutions", x: panelMargin + r3_advisory + gap + r3_risk + gap + r3_stablecoin + gap, y: row3Y, w: r3_tooling, h: row3H, alignTop: true },
    { section: "Meme Tokens", x: panelMargin + r3_advisory + gap + r3_risk + gap + r3_stablecoin + gap + r3_tooling + gap, y: row3Y, w: r3_meme, h: row3H, alignTop: true },

    // Row 4: DeFi, NFTs, Gaming & ENT, Real World Assets
    { section: "DeFi", x: panelMargin, y: row4Y, w: r4_defi, h: row4H, alignLeft: true, alignTop: true },
    { section: "NFT Markets", x: panelMargin + r4_defi + gap, y: row4Y, w: r4_nfts, h: row4H, alignTop: true },
    { section: "Gaming & ENT", x: panelMargin + r4_defi + gap + r4_nfts + gap, y: row4Y, w: r4_gaming, h: row4H, alignTop: true },
    { section: "Real World Assets", x: panelMargin + r4_defi + gap + r4_nfts + gap + r4_gaming + gap, y: row4Y, w: r4_rwas, h: row4H, alignTop: true },

    // Right side vertical panels - fill to right edge
    // Hedera Council - tall vertical strip (2 columns, big logos)
    { section: "Hedera Council", x: rightX, y: contentY, w: councilW, h: councilH, isCouncil: true, isVertical: true },

    // Independent Core Organizations - vertical strip
    { section: "Independent Core Organizations", x: rightX + councilW + gap, y: contentY, w: coreOrgsW, h: coreOrgsH, isCoreOrgs: true, isVertical: true },

    // Native Services - below Core Orgs with proper title spacing
    { section: "Native Services", x: rightX + councilW + gap, y: contentY + coreOrgsH + rowGap, w: coreOrgsW, h: nativeH, isNativeServices: true }
  ];

  // Define boundaries for hover expansion
  // All sections should expand to fill the content area but not beyond
  const leftBoundary = panelMargin;  // 70
  const rightBoundary = W - panelMargin;  // 1850 (aligns with right edge of Independent Core Organizations)
  const topBoundary = contentY - 15;  // 95 (a bit above content for title)
  const bottomBoundary = H - footerSpace + 10;  // 1005

  panels.forEach(panel => {
    const secData = sectionData[panel.section];
    if (!secData) return;

    // Create a group for this section with hover effects
    // Transform-origin: grow towards center of map (960, 540)
    const centerX = W / 2;  // 960
    const centerY = H / 2;  // 540
    const sectionCenterX = panel.x + panel.w / 2;
    const sectionCenterY = panel.y + panel.h / 2;
    // If section is left of center, anchor on left; if right of center, anchor on right
    const originX = sectionCenterX < centerX ? panel.x : panel.x + panel.w;
    // If section is above center, anchor on top; if below center, anchor on bottom
    const originY = sectionCenterY < centerY ? panel.y : panel.y + panel.h;

    // Calculate max scale based on boundaries
    // The scale is limited by how far the panel can grow before hitting a boundary
    let maxScaleX = 10;  // Start with a high value
    let maxScaleY = 10;

    // Horizontal constraints
    if (originX === panel.x) {
      // Origin at left edge - right edge expands right
      maxScaleX = (rightBoundary - panel.x) / panel.w;
    } else {
      // Origin at right edge - left edge expands left
      maxScaleX = (panel.x + panel.w - leftBoundary) / panel.w;
    }

    // Vertical constraints
    if (originY === panel.y) {
      // Origin at top edge - bottom edge expands down
      maxScaleY = (bottomBoundary - panel.y) / panel.h;
    } else {
      // Origin at bottom edge - top edge expands up
      maxScaleY = (panel.y + panel.h - topBoundary) / panel.h;
    }

    // Use the minimum of the two to maintain aspect ratio, cap at 180%
    const maxScale = Math.min(maxScaleX, maxScaleY, 1.8);

    const sectionClass = panel.isCouncil ? "section-group council-section" : "section-group";
    const sectionGroup = svg.append("g")
      .attr("class", sectionClass)
      .attr("data-section", panel.section)
      .attr("data-max-scale", maxScale.toFixed(2))
      .style("transform-origin", `${originX}px ${originY}px`);

    // Panel background (box starts below title)
    sectionGroup.append("rect").attr("class", "panel")
      .attr("x", panel.x).attr("y", panel.y)
      .attr("width", panel.w).attr("height", panel.h).attr("rx", 12);

    const activeSubcats = Object.entries(secData.subcategories).filter(([_, items]) => items.length > 0);

    if (panel.isCouncil) {
      // Council - render both normal (2 columns) and hover (5 columns) layouts
      const allItems = activeSubcats.flatMap(([_, items]) => items)
        .sort((a, b) => a.entity.localeCompare(b.entity));

      const innerPad = 8;

      // Define aspect ratios for each logo
      const logoAspectRatios = {
        "Google": 1.67, "IBM": 1.67, "Boeing": 4.3, "Deutsche Telekom": 1.67,
        "LG Electronics": 1.67, "Nomura": 1.67, "Ubisoft": 1.67, "UCL": 1.0,
        "Shinhan Bank": 1.67, "Dell": 2.18, "DLA Piper": 1.67, "EDF": 1.67,
        "eftpos": 1.0, "Hitachi": 1.67, "Mondelez": 1.67, "ServiceNow": 1.67,
        "Swirlds Labs": 1.67, "Tata Communications": 1.67, "Worldpay": 3.71,
        "Zain Group": 1.67, "LSE": 1.67, "abrdn": 1.67, "Arrow": 1.67,
        "Cofra": 1.67, "Dentons": 1.67, "IIT Madras": 1.67, "Magalu": 1.67,
        "Repsol": 4.27, "Blockchain for Energy": 2.23, "GBBC": 1.67
      };

      // Helper function to render council logos with custom panel dimensions
      const renderCouncilLogos = (targetGroup, cols, baseHeight, panelX, panelW, panelY, panelH, renderPanel) => {
        const availableWidth = panelW - innerPad * 2;
        const availableHeight = panelH - innerPad * 2;
        const rows = Math.ceil(allItems.length / cols);
        const actualCellW = availableWidth / cols;
        const actualCellH = availableHeight / rows;
        const startX = panelX + innerPad;
        const startY = panelY + innerPad;

        // Render panel background if requested
        if (renderPanel) {
          targetGroup.append("rect").attr("class", "panel")
            .attr("x", panelX).attr("y", panelY)
            .attr("width", panelW).attr("height", panelH).attr("rx", 12);
        }

        allItems.forEach((item, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;

          const aspectRatio = logoAspectRatios[item.entity] || 2.5;
          let logoH = baseHeight;
          let logoW = logoH * aspectRatio;

          // Size adjustments for specific logos
          if (item.entity === "GBBC") { logoW *= 0.6; logoH *= 0.6; }
          if (item.entity === "Repsol" || item.entity === "Boeing" || item.entity === "Worldpay") {
            logoW *= 0.5; logoH *= 0.5;
          }

          // Cap width to fit in cell
          if (logoW > actualCellW - 8) {
            logoW = actualCellW - 8;
            logoH = logoW / aspectRatio;
          }

          const logoX = startX + col * actualCellW + (actualCellW - logoW) / 2;
          const logoY = startY + row * actualCellH + (actualCellH - logoH) / 2;

          const logoFile = findLogoFile(item.entity);
          const logoData = imageToDataUri(logoFile);

          const link = item.website ? targetGroup.append("a")
            .attr("href", item.website)
            .attr("target", "_blank")
            .attr("class", "logo-link") : targetGroup;

          if (logoData?.type === "svg") {
            link.append("image").attr("x", logoX).attr("y", logoY)
              .attr("width", logoW).attr("height", logoH)
              .attr("href", `data:image/svg+xml;base64,${Buffer.from(logoData.content).toString('base64')}`)
              .attr("preserveAspectRatio", "xMidYMid meet");
          } else if (logoData?.dataUri) {
            link.append("image").attr("x", logoX).attr("y", logoY)
              .attr("width", logoW).attr("height", logoH)
              .attr("href", logoData.dataUri).attr("preserveAspectRatio", "xMidYMid meet");
          } else {
            link.append("text").attr("class", "council-logo-text")
              .attr("x", logoX + logoW / 2).attr("y", logoY + logoH / 2 + 3)
              .attr("text-anchor", "middle").attr("font-size", "7px").text(item.entity);
          }
        });
      };

      // Normal state: 2 columns within original panel bounds
      const normalGroup = sectionGroup.append("g").attr("class", "council-normal");
      renderCouncilLogos(normalGroup, 2, 50, panel.x, panel.w, panel.y, panel.h, false);

      // Hover state: 5 columns with 2x bigger logos, expanded panel
      // Calculate expanded dimensions: grow left from the right edge
      const hoverLogoBaseHeight = 100;  // 2x the normal size
      const hoverCols = 5;

      // Calculate width needed for 5 columns of 2x logos
      const hoverCellW = 200;
      const hoverPanelW = hoverCols * hoverCellW + innerPad * 2;  // ~1016px

      // Expand leftward from the right edge of the original panel
      const hoverPanelX = panel.x + panel.w - hoverPanelW;
      const hoverPanelY = panel.y;
      const hoverPanelH = panel.h;

      // Calculate scale ratio for animation (normal width / hover width)
      const scaleRatio = panel.w / hoverPanelW;  // ~0.315

      const hoverGroup = sectionGroup.append("g")
        .attr("class", "council-hover")
        .attr("data-scale-ratio", scaleRatio.toFixed(3))
        .style("transform", `scale(${scaleRatio})`)
        .style("transform-origin", `${panel.x + panel.w}px ${panel.y + panel.h / 2}px`);
      renderCouncilLogos(hoverGroup, hoverCols, hoverLogoBaseHeight, hoverPanelX, hoverPanelW, hoverPanelY, hoverPanelH, true);

      // Add title to hover group (positioned for expanded layout)
      // CSS sets .section-title to 10px, other sections scale 1.8x = 18px visually
      // Council doesn't scale, so use inline style to set 18px directly (overrides CSS)
      hoverGroup.append("text").attr("class", "section-title council-hover-title")
        .attr("x", hoverPanelX + 3)
        .attr("y", hoverPanelY - 9)
        .style("font-size", "18px")
        .attr("data-section", panel.section)
        .text(panel.section);
    } else if (panel.isCoreOrgs) {
      // Independent Core Organizations - vertical or horizontal layout
      const allItems = activeSubcats.flatMap(([_, items]) => items);

      if (panel.isVertical) {
        // Vertical layout - stack logos vertically, centered horizontally
        // For narrow vertical panel, scale logos to fit
        const maxLogoW = panel.w - 20;  // 10px padding each side
        const verticalGap = 35;  // Space between logos

        // Individual heights to match visual sizing of Hashgraph logo
        const logoHeights = {
          "Hashgraph": 31,
          "Hedera Council": 99,  // 10% larger
          "Hedera Foundation": 112,  // 25% larger
          "The Hashgraph Association": 42,
          "Exponential Science": 70
        };

        // Logo aspect ratios (width/height) - calculate width from height
        const logoAspectRatios = {
          "Hashgraph": 3.7,
          "Hedera Council": 3.7,
          "Hedera Foundation": 3.7,
          "The Hashgraph Association": 3.7,
          "Exponential Science": 3.7
        };

        // Calculate total height based on individual logo heights
        const defaultHeight = 55;
        const totalHeight = allItems.reduce((sum, item) => sum + (logoHeights[item.entity] || defaultHeight), 0) + (allItems.length - 1) * verticalGap;
        let currentY = panel.y + (panel.h - totalHeight) / 2;

        // Custom Y offsets for individual logos
        const logoYOffsets = {
          "Hashgraph": 10,  // Move down 10 pixels
          "Hedera Council": 20,  // Move down 20 pixels
          "Hedera Foundation": -10,  // Move up 10 pixels
          "The Hashgraph Association": -10  // Move up 10 pixels
        };

        allItems.forEach((item, idx) => {
          const logoH = logoHeights[item.entity] || defaultHeight;
          const aspectRatio = logoAspectRatios[item.entity] || 3.7;
          const logoW = logoH * aspectRatio;
          const logoX = panel.x + (panel.w - logoW) / 2;
          const logoY = currentY + (logoYOffsets[item.entity] || 0);

          let logoKey = item.entity;
          if (item.entity === "Hashgraph") logoKey = "Hashgraph Full";
          if (item.entity === "Hedera Foundation") logoKey = "Hedera Foundation Full";
          if (item.entity === "The Hashgraph Association") logoKey = "The Hashgraph Association Full";
          if (item.entity === "Exponential Science") logoKey = "Exponential Science Full";

          const logoFile = findLogoFile(logoKey);
          const logoData = imageToDataUri(logoFile);

          // Wrap in link if website exists
          const link = item.website ? sectionGroup.append("a")
            .attr("href", item.website)
            .attr("target", "_blank")
            .attr("class", "logo-link") : sectionGroup;

          if (logoData?.type === "svg") {
            link.append("image").attr("x", logoX).attr("y", logoY)
              .attr("width", logoW).attr("height", logoH)
              .attr("href", `data:image/svg+xml;base64,${Buffer.from(logoData.content).toString('base64')}`)
              .attr("preserveAspectRatio", "xMidYMid meet");
          } else if (logoData?.dataUri) {
            link.append("image").attr("x", logoX).attr("y", logoY)
              .attr("width", logoW).attr("height", logoH)
              .attr("href", logoData.dataUri).attr("preserveAspectRatio", "xMidYMid meet");
          } else {
            link.append("text").attr("class", "council-logo-text")
              .attr("x", logoX + logoW / 2).attr("y", logoY + logoH / 2 + 3)
              .attr("text-anchor", "middle").attr("font-size", "8px").text(item.entity);
          }

          currentY += logoH + verticalGap;
        });
      } else {
        // Horizontal layout (original)
        // Individual logo sizes (half size)
        const logoSizes = {
          "Hashgraph": { w: 150, h: 40 },
          "Hedera Council": { w: 408, h: 110 },
          "Hedera Foundation": { w: 512, h: 137 },
          "The Hashgraph Association": { w: 180, h: 48 },
          "Exponential Science": { w: 300, h: 80 }
        };

        const defaultSize = { w: 225, h: 60 };
        const customGaps = [30, 40, 22, 22, 22];  // Half size gaps

        const maxHeight = Math.max(...allItems.map(item => (logoSizes[item.entity] || defaultSize).h));
        const centerY = panel.y + panel.h / 2;

        let currentX = panel.x + customGaps[0];

        allItems.forEach((item, idx) => {
          const size = logoSizes[item.entity] || defaultSize;

          // Half size offsets
          const logoOffsets = {
            "Hashgraph": 80,
            "Hedera Council": 93,
            "Hedera Foundation": -87,
            "The Hashgraph Association": -120,
            "Exponential Science": -120
          };
          const xOffset = logoOffsets[item.entity] || 0;

          const logoX = currentX + xOffset;
          const logoY = centerY - size.h / 2;

          let logoKey = item.entity;
          if (item.entity === "Hashgraph") logoKey = "Hashgraph Full";
          if (item.entity === "Hedera Foundation") logoKey = "Hedera Foundation Full";
          if (item.entity === "The Hashgraph Association") logoKey = "The Hashgraph Association Full";
          if (item.entity === "Exponential Science") logoKey = "Exponential Science Full";

          const logoFile = findLogoFile(logoKey);
          const logoData = imageToDataUri(logoFile);

          if (logoData?.type === "svg") {
            sectionGroup.append("image").attr("x", logoX).attr("y", logoY)
              .attr("width", size.w).attr("height", size.h)
              .attr("href", `data:image/svg+xml;base64,${Buffer.from(logoData.content).toString('base64')}`)
              .attr("preserveAspectRatio", "xMidYMid meet");
          } else if (logoData?.dataUri) {
            sectionGroup.append("image").attr("x", logoX).attr("y", logoY)
              .attr("width", size.w).attr("height", size.h)
              .attr("href", logoData.dataUri).attr("preserveAspectRatio", "xMidYMid meet");
          } else {
            sectionGroup.append("text").attr("class", "council-logo-text")
              .attr("x", logoX + size.w / 2).attr("y", logoY + size.h / 2 + 3)
              .attr("text-anchor", "middle").attr("font-size", "8px").text(item.entity);
          }

          currentX += size.w + (customGaps[idx + 1] || 0);
        });
      }
    } else if (panel.isNativeServices) {
      // Native Services - centered in box
      const allItems = activeSubcats.flatMap(([_, items]) => items);

      // Service display data: abbreviation and 2-line name
      const serviceData = {
        "Hedera Token Service": { abbrev: "HTS", line1: "Hedera Token", line2: "Service" },
        "Hedera Consensus Service": { abbrev: "HCS", line1: "Hedera Consensus", line2: "Service" },
        "Hedera Smart Contract Service": { abbrev: "HSCS", line1: "Hedera Smart Contract", line2: "Service" }
      };

      // Calculate spacing and center items vertically in the box
      const itemHeight = 55;  // Height of each item (abbreviation + 2 lines)
      const itemGap = 25;  // Gap between items
      const totalItemsHeight = (allItems.length * itemHeight) + ((allItems.length - 1) * itemGap);
      const boxCenterY = panel.y + panel.h / 2;
      const textStartY = boxCenterY - totalItemsHeight / 2 + 10;
      const itemSpacing = itemHeight + itemGap;

      allItems.forEach((item, idx) => {
        // Wrap in link if website exists
        const link = item.website ? sectionGroup.append("a")
          .attr("href", item.website)
          .attr("target", "_blank")
          .attr("class", "logo-link") : sectionGroup;

        const itemY = textStartY + idx * itemSpacing;
        const data = serviceData[item.entity] || { abbrev: "", line1: item.entity, line2: "" };

        // Abbreviation label (40% smaller: 26px -> 16px)
        link.append("text")
          .attr("x", panel.x + panel.w / 2)
          .attr("y", itemY)
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .attr("font-weight", "700")
          .attr("fill", "#8b5cf6")
          .text(data.abbrev);

        // Service name line 1 (white)
        link.append("text")
          .attr("x", panel.x + panel.w / 2)
          .attr("y", itemY + 18)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-weight", "500")
          .attr("fill", "#ffffff")
          .text(data.line1);

        // Service name line 2 (white)
        link.append("text")
          .attr("x", panel.x + panel.w / 2)
          .attr("y", itemY + 31)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-weight", "500")
          .attr("fill", "#ffffff")
          .text(data.line2);
      });
    } else {
      // Regular sections - logos spread out to use available space
      const allItems = activeSubcats.flatMap(([_, items]) => items)
        .sort((a, b) => a.entity.localeCompare(b.entity));

      const innerPad = 10;
      const availableWidth = panel.w - innerPad * 2;
      const availableHeight = panel.h - innerPad * 2;

      // Calculate optimal grid - spread items evenly
      const minCellW = 38;
      const minCellH = 52;
      const logoSize = 28;

      // Find best column count that fits items and spreads them out
      const maxCols = Math.floor(availableWidth / minCellW);
      let cols = Math.max(1, Math.min(maxCols, allItems.length));
      let numRows = Math.ceil(allItems.length / cols);

      // Adjust columns to minimize empty space while keeping items spread
      while (cols > 1 && numRows * minCellH <= availableHeight) {
        const newCols = cols - 1;
        const newRows = Math.ceil(allItems.length / newCols);
        if (newRows * minCellH > availableHeight) break;
        cols = newCols;
        numRows = newRows;
      }

      // Use fixed cell height for consistent row alignment across sections
      const effectiveCellW = availableWidth / cols;
      const effectiveCellH = minCellH;  // Fixed height for alignment
      const effectiveLogoSize = Math.min(logoSize, effectiveCellW - 10, effectiveCellH - 22);

      const gridStartX = panel.x + innerPad;
      const gridStartY = panel.y + innerPad;

      // Calculate row spacing to distribute rows evenly with equal top/bottom padding
      // Total content height for all rows at minimum spacing
      const minTotalRowsHeight = numRows * effectiveCellH;
      // Extra space available after accounting for top padding (bottom should match top)
      const extraSpace = availableHeight - minTotalRowsHeight;
      // Distribute extra space between rows, but cap spacing for sections with few rows
      // This prevents 2-row sections from pushing the second row to the very bottom
      const maxExtraSpacing = 15; // Maximum extra spacing between rows
      const rawRowSpacing = numRows > 1 ? extraSpace / (numRows - 1) : 0;
      const rowSpacing = Math.min(rawRowSpacing, maxExtraSpacing);
      // Actual cell height including distributed spacing
      const actualCellH = effectiveCellH + rowSpacing;

      allItems.forEach((item, idx) => {
        const itemRow = Math.floor(idx / cols);
        const itemCol = idx % cols;

        // Center logo within cell, using distributed spacing
        const cellCenterX = gridStartX + itemCol * effectiveCellW + effectiveCellW / 2;
        const cellCenterY = gridStartY + itemRow * actualCellH + effectiveCellH / 2;

        // Skip if cell would be outside panel bounds
        if (cellCenterY + effectiveCellH / 2 > panel.y + panel.h) return;

        const logoX = cellCenterX - effectiveLogoSize / 2;
        const logoY = cellCenterY - effectiveCellH / 2 + 5;  // Offset from top of cell

        const logoFile = findLogoFile(item.entity);
        const logoData = imageToDataUri(logoFile);

        // Wrap in link if website exists
        const link = item.website ? sectionGroup.append("a")
          .attr("href", item.website)
          .attr("target", "_blank")
          .attr("class", "logo-link") : sectionGroup;

        if (logoData?.dataUri) {
          const clipId = `clip-${panel.section}-${idx}`.replace(/[^a-z0-9]/gi, '-');
          defs.append("clipPath").attr("id", clipId).append("circle")
            .attr("cx", logoX + effectiveLogoSize / 2).attr("cy", logoY + effectiveLogoSize / 2).attr("r", effectiveLogoSize / 2);
          link.append("circle").attr("class", "logo-circle")
            .attr("cx", logoX + effectiveLogoSize / 2).attr("cy", logoY + effectiveLogoSize / 2).attr("r", effectiveLogoSize / 2);
          link.append("image").attr("x", logoX).attr("y", logoY)
            .attr("width", effectiveLogoSize).attr("height", effectiveLogoSize)
            .attr("href", logoData.dataUri).attr("clip-path", `url(#${clipId})`)
            .attr("preserveAspectRatio", "xMidYMid slice");
        } else if (logoData?.type === "svg") {
          const clipId = `clip-${panel.section}-svg-${idx}`.replace(/[^a-z0-9]/gi, '-');
          defs.append("clipPath").attr("id", clipId).append("circle")
            .attr("cx", logoX + effectiveLogoSize / 2).attr("cy", logoY + effectiveLogoSize / 2).attr("r", effectiveLogoSize / 2);
          link.append("circle").attr("class", "logo-circle")
            .attr("cx", logoX + effectiveLogoSize / 2).attr("cy", logoY + effectiveLogoSize / 2).attr("r", effectiveLogoSize / 2);
          link.append("image").attr("x", logoX).attr("y", logoY)
            .attr("width", effectiveLogoSize).attr("height", effectiveLogoSize)
            .attr("href", `data:image/svg+xml;base64,${Buffer.from(logoData.content).toString('base64')}`)
            .attr("clip-path", `url(#${clipId})`)
            .attr("preserveAspectRatio", "xMidYMid slice");
        } else {
          link.append("circle").attr("class", "logo-circle")
            .attr("cx", logoX + effectiveLogoSize / 2).attr("cy", logoY + effectiveLogoSize / 2).attr("r", effectiveLogoSize / 2);
          link.append("text").attr("class", "logo-text")
            .attr("x", logoX + effectiveLogoSize / 2).attr("y", logoY + effectiveLogoSize / 2 + 5)
            .attr("text-anchor", "middle").attr("font-size", "12px")
            .text(item.entity.substring(0, 2).toUpperCase());
        }

        // Label below logo - only if it fits within panel
        const labelY = logoY + effectiveLogoSize + 14;
        if (labelY < panel.y + panel.h - 5) {
          const lines = wrapText(item.entity, 12);
          lines.forEach((line, lineIdx) => {
            const textY = labelY + lineIdx * 8;
            if (textY < panel.y + panel.h - 2) {
              link.append("text").attr("class", "logo-label")
                .attr("x", cellCenterX)
                .attr("y", textY)
                .attr("text-anchor", "middle").attr("font-size", "6px")
                .text(line);
            }
          });
        }
      });
    }

    // Section title ABOVE the box - rendered LAST to be on top of everything
    sectionGroup.append("text").attr("class", "section-title")
      .attr("x", panel.x + 3)
      .attr("y", panel.y - 5)
      .attr("font-size", "3.5px")
      .attr("data-section", panel.section)
      .text(panel.section);
  });

  // Footer - reasonable size for 1920x1080
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  svg.append("text").attr("class", "footer-text").attr("x", 35).attr("y", H - 43)
    .attr("font-size", "10px").text(`Data as of: ${dateStr}`);

  svg.append("text").attr("class", "footer-note").attr("x", 35).attr("y", H - 31)
    .attr("font-size", "9px").text("Note: The list of projects is not comprehensive.");

  // Genfinity branding logo - moved up and left 25px from original text position
  const genfinityLogoPath = path.join(LOGOS_PATH, "branding", "genfinity-logo.svg");
  const genfinityLogo = imageToDataUri(genfinityLogoPath);
  const logoWidth = 120;
  const logoHeight = 19; // Aspect ratio ~6.4:1 from viewBox 641.2 x 100
  const logoX = W - 35 - logoWidth; // Right edge at W - 35 (moved left 25px)
  const logoY = H - 35 - logoHeight; // Bottom at H - 35 (moved up 25px)

  if (genfinityLogo?.type === "svg") {
    const genfinityLink = svg.append("a")
      .attr("href", "https://genfinity.io")
      .attr("target", "_blank")
      .style("cursor", "pointer");
    genfinityLink.append("image")
      .attr("x", logoX).attr("y", logoY)
      .attr("width", logoWidth).attr("height", logoHeight)
      .attr("href", `data:image/svg+xml;base64,${Buffer.from(genfinityLogo.content).toString('base64')}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
  }

  return svg.node().outerHTML;
}

function main() {
  ensureDist();
  const rows = readCSV();
  const sectionData = buildSectionData(rows);
  const svgStr = renderSVG(sectionData);
  fs.writeFileSync(OUT_SVG, svgStr, "utf8");
  console.log(`Wrote ${OUT_SVG}`);
}

main();
