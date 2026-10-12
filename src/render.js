import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import * as d3 from "d3";
import { JSDOM } from "jsdom";
import { logoRatio, wordmarkDataUri } from "./wordmarks.js";

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
  { name: "Strategic Partners", subcategories: ["Strategic Partner"] },
  { name: "Community Partners", subcategories: ["Community Partner"] },
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
  "Strategic Partners": "Strategic Partners",
  "Community Partners": "Community Partners",
  "Independent Core Organizations": "Independent Core Organizations",
  "Meme Tokens": "Meme Tokens",
  "Native Services": "Native Services"
};

// Logo file finder - section parameter allows section-specific logo selection
function findLogoFile(entityName, section = null, csvLogo = "") {
  // The CSV's Logo column (a path under logos/) wins: the hederacouncil.org sync writes it
  if (csvLogo && fs.existsSync(path.join(LOGOS_PATH, csvLogo))) return path.join(LOGOS_PATH, csvLogo);
  // Council-specific logo mappings (used only when section is "Hedera Council")
  const councilMappings = {
    "Accenture": path.join(LOGOS_PATH, "council", "accenture-black.svg"),
    "Google": path.join(LOGOS_PATH, "council", "google-black.svg"),
    "IBM": path.join(LOGOS_PATH, "council", "ibm-black.svg"),
    "Dell": path.join(LOGOS_PATH, "council", "dell-black.svg"),
    "Deutsche Telekom": path.join(LOGOS_PATH, "council", "deutsche-telekom-black.svg"),
    "LG": path.join(LOGOS_PATH, "council", "lg-black.svg"),
    "Nomura": path.join(LOGOS_PATH, "council", "nomura-black.svg"),
    "Ubisoft": path.join(LOGOS_PATH, "council", "ubisoft-black.svg"),
    "Shinhan Bank": path.join(LOGOS_PATH, "council", "shinhan-bank-black.svg"),
    "DLA Piper": path.join(LOGOS_PATH, "council", "dla-piper-black.svg"),
    "EDF": path.join(LOGOS_PATH, "council", "edf-black.svg"),
    "FedEx": path.join(LOGOS_PATH, "council", "fedex.svg"),
    "Swirlds": path.join(LOGOS_PATH, "council", "swirlds-black.svg"),
    "Tata Communications": path.join(LOGOS_PATH, "council", "tata-black.svg"),
    "LSE": path.join(LOGOS_PATH, "council", "lse-black.svg"),
    "Aberdeen": path.join(LOGOS_PATH, "council", "aberdeen-black.svg"),
    "Mondelēz": path.join(LOGOS_PATH, "council", "mondelez-black.svg"),
    "ServiceNow": path.join(LOGOS_PATH, "council", "service-now-black.svg"),
    "Zain": path.join(LOGOS_PATH, "council", "zain-black.svg"),
    "Arrow": path.join(LOGOS_PATH, "council", "arrow-black.svg"),
    "Dentons": path.join(LOGOS_PATH, "council", "dentons-black.svg"),
    "IIT Madras": path.join(LOGOS_PATH, "council", "iit-madras-black.svg"),
    "Magalu": path.join(LOGOS_PATH, "council", "magalu-black.svg"),
    "McLaren Racing": path.join(LOGOS_PATH, "council", "mclaren-racing-black.svg"),
    "Repsol": path.join(LOGOS_PATH, "council", "repsol-logo-white-flat.png"),
    "Blockchain For Energy": path.join(LOGOS_PATH, "council", "blockchain-for-energy.svg"),
    "BitGo": path.join(LOGOS_PATH, "council", "bitgo-black.svg"),
    "Australian Payments Plus": path.join(LOGOS_PATH, "council", "australian-payments-plus-black.svg"),
    "Avery Dennison": path.join(LOGOS_PATH, "council", "avery-dennison-black.svg"),
    "NSE": path.join(LOGOS_PATH, "council", "nse-black.svg"),
    "Standard Bank": path.join(LOGOS_PATH, "council", "standard-bank-black.svg"),
    "Chainlink Labs": path.join(LOGOS_PATH, "council", "chainlink-labs-black.svg"),
    "Wipro": path.join(LOGOS_PATH, "council", "wipro-black.svg"),
  };

  // Check council mappings first if section is Hedera Council
  if (section === "Hedera Council" && councilMappings[entityName] && fs.existsSync(councilMappings[entityName])) {
    return councilMappings[entityName];
  }

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
    "TierBot": path.join(LOGOS_PATH, "Tooling and Solutions", "TierBot AI.png"),
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
    "Gilmore Estates": path.join(LOGOS_PATH, "rwas", "Gilmore Estates.jpg"),
    "UTU Renegades": path.join(LOGOS_PATH, "rwas", "UTU Renegades.jpg"),
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
    "Jeeteroo": path.join(LOGOS_PATH, "meme", "Jeeteroo.jpg"),
    "Fly": path.join(LOGOS_PATH, "meme", "Fly.jpg"),
    "Bober": path.join(LOGOS_PATH, "meme", "Bober.jpg"),
    "Dinopack": path.join(LOGOS_PATH, "meme", "Dinopack.png"),
    "2FingersInu": path.join(LOGOS_PATH, "meme", "2FingersInu.jpg"),
    "Escohbar": path.join(LOGOS_PATH, "meme", "Escohbar.jpg"),
    "Hashman": path.join(LOGOS_PATH, "meme", "Hashman.png"),
    "Honk": path.join(LOGOS_PATH, "meme", "Honk.png"),
    "Fins": path.join(LOGOS_PATH, "meme", "Fins.png"),
    "Trash Artists": path.join(LOGOS_PATH, "meme", "Trash.jpg"),
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
        status: row.Status?.trim() || "", website: row.Website?.trim() || "",
        logo: row.Logo?.trim() || ""
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

  // Layout margins - define before use
  const leftMargin = 50;   // Left margin (shifted left to balance visual perception)
  const rightMargin = 70;  // Right margin

  // Header - aligned with section boxes
  svg.append("text").attr("class", "header-title")
    .attr("x", leftMargin).attr("y", 65)
    .attr("font-size", "30px")
    .text("An Incomplete Map of the Hedera Ecosystem");

  const contentY = 110;  // 4x more top padding
  const rowGap = 28;  // Space between rows for titles
  const gap = 8;  // More even spacing between sections

  // Layout fills full canvas width
  const footerSpace = 85;  // 4x more bottom padding

  // Right side: Hedera Council column (2 columns of logos) + a side column with the council's Strategic and
  // Community Partners (hederacouncil.org's other two tabs), the Independent Core Organizations and Native Services
  const councilW = 320;
  const sideW = 200;
  const rightSectionW = councilW + sideW + gap;
  const leftAreaW = W - leftMargin - rightMargin - rightSectionW - gap;  // Left area width

  const rightX = W - rightMargin - rightSectionW;
  const councilH = H - contentY - footerSpace;  // Full height for Council with bottom padding
  const sideX = rightX + councilW + gap;

  // Side column, top to bottom. Heights fit the content; Native Services takes what is left.
  const sideBoxes = [
    { section: "Strategic Partners", h: 110 },
    { section: "Community Partners", h: 200 },
    { section: "Independent Core Organizations", h: 230 },
    { section: "Native Services", h: 0 },
  ];
  sideBoxes[sideBoxes.length - 1].h = councilH - rowGap * (sideBoxes.length - 1) - sideBoxes.slice(0, -1).reduce((t, b) => t + b.h, 0);

  // Calculate row heights to fill vertical space (4 rows + footer)
  const availableHeight = H - contentY - footerSpace;
  const totalRowGaps = rowGap * 3;
  const rowH = Math.floor((availableHeight - totalRowGaps) / 4);
  // the last row takes the rounding remainder so the left area ends exactly where the right columns end
  const lastRowH = availableHeight - totalRowGaps - rowH * 3;

  // Row 1: 3 panels (left side) - Wallets wider, Exchanges narrower
  const row1Y = contentY;
  const row1H = rowH;
  const r1_wallets = Math.floor(leftAreaW * 0.22);  // Wider for wallets
  const r1_custodians = Math.floor(leftAreaW * 0.12);
  const r1_exchanges = leftAreaW - r1_wallets - r1_custodians - gap * 2;  // Narrower

  // Row 2: 5 panels - proportional to entity count
  const row2Y = row1Y + row1H + rowGap;
  const row2H = rowH;
  const r2_oracles = Math.floor(leftAreaW * 0.08);
  const r2_bridges = Math.floor(leftAreaW * 0.16);
  const r2_services = Math.floor(leftAreaW * 0.32);
  const r2_onramps = Math.floor(leftAreaW * 0.14);
  const r2_partners = leftAreaW - r2_oracles - r2_bridges - r2_services - r2_onramps - gap * 4;

  // Row 3: 5 panels - proportional to entity count
  const row3Y = row2Y + row2H + rowGap;
  const row3H = rowH;
  const r3_advisory = Math.floor(leftAreaW * 0.07);
  const r3_risk = Math.floor(leftAreaW * 0.17);
  const r3_stablecoin = Math.floor(leftAreaW * 0.10);
  const r3_tooling = Math.floor(leftAreaW * 0.31);
  const r3_meme = leftAreaW - r3_advisory - r3_risk - r3_stablecoin - r3_tooling - gap * 4;

  // Row 4: 4 panels (DeFi, NFTs, Gaming & ENT, Real World Assets)
  const row4Y = row3Y + row3H + rowGap;
  const row4H = lastRowH;
  const r4_defi = Math.floor(leftAreaW * 0.30);
  const r4_nfts = Math.floor(leftAreaW * 0.10);
  const r4_gaming = Math.floor(leftAreaW * 0.28);
  const r4_rwas = leftAreaW - r4_defi - r4_nfts - r4_gaming - gap * 3;

  const rowsDef = [
    { y: row1Y, h: row1H, boxes: [["Wallets", r1_wallets], ["Custodians", r1_custodians], ["Exchanges", r1_exchanges]] },
    { y: row2Y, h: row2H, boxes: [["Oracles", r2_oracles], ["Bridges and Interoperability", r2_bridges], ["Services", r2_services], ["Onramps", r2_onramps], ["Implementation Partners", r2_partners]] },
    { y: row3Y, h: row3H, boxes: [["Advisory Firms", r3_advisory], ["Risk and Compliance", r3_risk], ["Stablecoin Infrastructure", r3_stablecoin], ["Tooling and Solutions", r3_tooling], ["Meme Tokens", r3_meme]] },
    { y: row4Y, h: row4H, boxes: [["DeFi", r4_defi], ["NFT Markets", r4_nfts], ["Gaming & ENT", r4_gaming], ["Real World Assets", r4_rwas]] },
  ];

  const panels = [];
  rowsDef.forEach(row => {
    let x = leftMargin;
    row.boxes.forEach(([section, w]) => {
      panels.push({ section, x, y: row.y, w, h: row.h, alignTop: true });
      x += w + gap;
    });
  });
  panels.push({ section: "Hedera Council", x: rightX, y: contentY, w: councilW, h: councilH, isCouncil: true });
  {
    let y = contentY;
    sideBoxes.forEach(b => {
      panels.push({
        section: b.section, x: sideX, y, w: sideW, h: b.h,
        isCoreOrgs: b.section === "Independent Core Organizations",
        isNativeServices: b.section === "Native Services",
        isPartners: b.section === "Strategic Partners" || b.section === "Community Partners",
      });
      y += b.h + rowGap;
    });
  }

  // Hover zoom. The hovered section grows to HOVER_SCALE times its size (the sizes hederamap.com has always
  // used: 1.8x, Exchanges 1.62x, Independent Core Organizations 1.61x; the council partner sections 1.6x like
  // the council's own hover logos) and the other boxes reflow around it, so nothing is covered and the map
  // stays one rectangle. The reflow itself runs in the page (dist/hedera-map.html, see "Hover layout").
  const HOVER_SCALE = {
    "Exchanges": 1.62,
    "Independent Core Organizations": 1.61,
    "Strategic Partners": 1.6,
    "Community Partners": 1.6,
  };

  // Council hover: the same logo sizes as always (2x base, then 0.75, 0.85 and 0.8 as below), in 3 columns so
  // the expanded council takes about a third of the map width instead of two thirds
  const hoverCols = 3;
  const hoverCellW = 180;
  const councilInnerPad = 8;
  const hoverPanelW = hoverCols * hoverCellW + councilInnerPad * 2;
  // The expanded council box: the left area and the side column narrow in proportion to make room
  // (the page computes the same box; it is passed in data-hover-box)
  const councilShrink = (W - leftMargin - rightMargin - 2 * gap - hoverPanelW) / (leftAreaW + sideW);
  const hoverPanelX = leftMargin + leftAreaW * councilShrink + gap;

  // Layout structure for the page's hover reflow
  svg.attr("data-layout", JSON.stringify({
    x: leftMargin, y: contentY, w: W - leftMargin - rightMargin, h: councilH, gap, rowGap,
    rows: rowsDef.map(r => r.boxes.map(([s]) => s)),
    council: "Hedera Council",
    side: sideBoxes.map(b => b.section),
  }));

  panels.forEach(panel => {
    const secData = sectionData[panel.section];
    if (!secData) return;

    const sectionClass = panel.isCouncil ? "section-group council-section" : "section-group";
    const sectionGroup = svg.append("g")
      .attr("class", sectionClass)
      .attr("data-section", panel.section)
      .attr("data-box", [panel.x, panel.y, panel.w, panel.h].map(v => +v.toFixed(2)).join(","))
      .attr("data-hover-scale", HOVER_SCALE[panel.section] || 1.8);

    // Panel background (box starts below title) - for non-Council sections
    // Council sections have panels inside their normal/hover groups
    if (!panel.isCouncil) {
      sectionGroup.append("rect").attr("class", "panel")
        .attr("x", panel.x).attr("y", panel.y)
        .attr("width", panel.w).attr("height", panel.h).attr("rx", 12);
    }

    const activeSubcats = Object.entries(secData.subcategories).filter(([_, items]) => items.length > 0);

    // Each logo is one <a class="map-item"> with its resting center (data-cx, data-cy); the page moves and
    // scales whole items when the boxes reflow. data-cell is the item's base cell (w,h) for that reflow.
    const itemLink = (target, item, cx, cy) => {
      const a = target.append("a").attr("class", item.website ? "logo-link map-item" : "map-item")
        .attr("data-cx", +cx.toFixed(2)).attr("data-cy", +cy.toFixed(2)).attr("data-entity", item.entity);
      if (item.website) a.attr("href", item.website).attr("target", "_blank");
      return a;
    };

    if (panel.isCouncil) {
      // Council - render both normal (2 columns) and hover (3 columns, bigger logos) layouts
      const allItems = activeSubcats.flatMap(([_, items]) => items)
        .sort((a, b) => a.entity.localeCompare(b.entity));

      const innerPad = councilInnerPad;

      // Define aspect ratios for each logo (box ratio; the artwork is fitted inside)
      const logoAspectRatios = {
        "Google": 1.67, "IBM": 1.67, "Deutsche Telekom": 1.67,
        "LG": 1.67, "Nomura": 1.67, "Ubisoft": 1.67,
        "Shinhan Bank": 1.67, "Dell": 2.18, "DLA Piper": 1.67, "EDF": 1.67,
        "Mondelēz": 1.67, "ServiceNow": 1.67,
        "Swirlds": 1.67, "Tata Communications": 1.67,
        "Zain": 1.67, "LSE": 1.67, "Aberdeen": 1.67, "Arrow": 1.67,
        "Dentons": 1.67, "IIT Madras": 1.67, "Magalu": 1.67,
        "McLaren Racing": 5.45, "Repsol": 4.27, "Blockchain For Energy": 2.23,
        "Australian Payments Plus": 2.5, "Avery Dennison": 2.5, "BitGo": 2.5,
        "Chainlink Labs": 2.5, "NSE": 2.5, "Standard Bank": 2.5,
        "Wipro": 2.5
      };

      // Helper to render council logos into a panel; bottomPadding is extra room at the bottom of the logo area
      const renderCouncilLogos = (targetGroup, cols, baseHeight, panelX, panelW, panelY, panelH, isHoverState = false, bottomPadding = 0, colNudge = 0) => {
        const availableWidth = panelW - innerPad * 2;
        const availableHeight = panelH - innerPad * 2 - bottomPadding;
        const rows = Math.ceil(allItems.length / cols);
        const actualCellW = availableWidth / cols;
        const actualCellH = availableHeight / rows;
        const startX = panelX + innerPad;
        const startY = panelY + innerPad;

        targetGroup.append("rect").attr("class", "panel")
          .attr("x", panelX).attr("y", panelY)
          .attr("width", panelW).attr("height", panelH).attr("rx", 12);

        allItems.forEach((item, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;

          const aspectRatio = logoAspectRatios[item.entity] || 2.5;
          let logoH = baseHeight * 0.75;  // Shrink all council logos by 25%
          let logoW = logoH * aspectRatio;

          // These logos are a good size in the normal state; the others shrink by 15%
          const goodSizeLogos = [
            "Aberdeen", "Blockchain For Energy", "Deutsche Telekom", "Dell", "Magalu",
            "IIT Madras", "ServiceNow", "Tata Communications"
          ];
          if (!goodSizeLogos.includes(item.entity)) {
            logoW *= 0.85; logoH *= 0.85;
          }

          // Additional size adjustment for very wide logos
          if (item.entity === "Repsol") {
            logoW *= 0.5; logoH *= 0.5;
          }
          if (item.entity === "McLaren Racing") {
            logoW *= 0.55; logoH *= 0.55;
          }

          // In hover state, reduce ALL logos by 20% for more breathing room
          if (isHoverState) {
            logoW *= 0.8; logoH *= 0.8;
          }

          // Cap width to fit in cell
          if (logoW > actualCellW - 8) {
            logoW = actualCellW - 8;
            logoH = logoW / aspectRatio;
          }

          // a little more room between the two columns (owner's spacing on hederamap.com)
          const nudge = cols === 2 ? (col === 0 ? -colNudge : colNudge) : 0;
          const cx = startX + col * actualCellW + actualCellW / 2 + nudge;
          const cy = startY + row * actualCellH + actualCellH / 2;
          const logoX = cx - logoW / 2;
          const logoY = cy - logoH / 2;

          const logoFile = findLogoFile(item.entity, "Hedera Council", item.logo);
          const href = wordmarkDataUri(logoFile, item.entity);
          const link = itemLink(targetGroup, item, cx, cy);

          if (href) {
            link.append("image").attr("class", "council-logo-image").attr("x", logoX).attr("y", logoY)
              .attr("width", logoW).attr("height", logoH)
              .attr("href", href)
              .attr("preserveAspectRatio", "xMidYMid meet");
          } else {
            link.append("text").attr("class", "council-logo-text")
              .attr("x", cx).attr("y", cy + 3)
              .attr("text-anchor", "middle").attr("font-size", "7px").text(item.entity);
          }
        });
      };

      // Normal state: 2 columns within the panel, extra bottom padding for breathing room
      const normalBottomPad = 20;
      const normalGroup = sectionGroup.append("g").attr("class", "council-normal")
        .attr("data-cell", "110,44");
      renderCouncilLogos(normalGroup, 2, 50, panel.x, panel.w, panel.y, panel.h, false, normalBottomPad, 4);

      // Hover state: 3 columns with the bigger logos, drawn in the expanded council box
      const hoverGroup = sectionGroup.append("g").attr("class", "council-hover");
      renderCouncilLogos(hoverGroup, hoverCols, 100, hoverPanelX, hoverPanelW, panel.y, panel.h, true);

      // Title of the expanded council (CSS sets .section-title to 10px; the expanded title is 18px like the
      // other sections' titles at 1.8x)
      hoverGroup.append("text").attr("class", "section-title council-hover-title")
        .attr("x", hoverPanelX + 3)
        .attr("y", panel.y - 9)
        .style("font-size", "18px")
        .attr("data-section", panel.section)
        .text(panel.section);

      sectionGroup.attr("data-hover-box", [hoverPanelX, panel.y, hoverPanelW, panel.h].map(v => +v.toFixed(2)).join(","));
    } else if (panel.isPartners) {
      // Strategic / Community Partners: white wordmarks like the council logos, 2 columns
      const allItems = activeSubcats.flatMap(([_, items]) => items)
        .sort((a, b) => a.entity.localeCompare(b.entity));
      const innerPad = 8;
      const cols = 2;
      const rows = Math.ceil(allItems.length / cols);
      const cellW = (panel.w - innerPad * 2) / cols;
      const cellH = (panel.h - innerPad * 2) / rows;
      sectionGroup.attr("data-cell", `${Math.round(cellW)},40`);
      const AREA = 1900;  // similar visual weight for wide and compact wordmarks
      allItems.forEach((item, idx) => {
        const col = idx % cols, row = Math.floor(idx / cols);
        const file = findLogoFile(item.entity, panel.section, item.logo);
        const ratio = logoRatio(file) || 3;
        let logoW = Math.sqrt(AREA * ratio), logoH = Math.sqrt(AREA / ratio);
        if (logoW > cellW - 8) { logoW = cellW - 8; logoH = logoW / ratio; }
        if (logoH > 30) { logoH = 30; logoW = logoH * ratio; }
        const cx = panel.x + innerPad + col * cellW + cellW / 2;
        const cy = panel.y + innerPad + row * cellH + cellH / 2;
        const href = wordmarkDataUri(file, item.entity);
        const link = itemLink(sectionGroup, item, cx, cy);
        if (href) {
          link.append("image").attr("class", "council-logo-image").attr("x", cx - logoW / 2).attr("y", cy - logoH / 2)
            .attr("width", logoW).attr("height", logoH).attr("href", href).attr("preserveAspectRatio", "xMidYMid meet");
        } else {
          link.append("text").attr("class", "council-logo-text").attr("x", cx).attr("y", cy + 3)
            .attr("text-anchor", "middle").attr("font-size", "7px").text(item.entity);
        }
        // a hit area the size of the cell, so the small wordmarks are easy to click
        link.append("rect").attr("x", cx - (cellW - 8) / 2).attr("y", cy - 16).attr("width", cellW - 8).attr("height", 32)
          .attr("fill", "transparent");
      });
    } else if (panel.isCoreOrgs) {
      // Independent Core Organizations - logos stacked vertically, evenly spaced, centered
      const allItems = activeSubcats.flatMap(([_, items]) => items);
      sectionGroup.attr("data-cell", "120,56");

      // Cropped artwork and sizes as tuned on hederamap.com
      const coreLogos = {
        "Hashgraph": { file: path.join(LOGOS_PATH, "core", "Hashgraph full size.svg"), w: 90.6, h: 24 },
        "Hedera Council": { file: path.join(LOGOS_PATH, "core", "Hedera Council cropped.svg"), w: 93, h: 29.46 },
        "Hedera Foundation": { file: path.join(LOGOS_PATH, "core", "Hedera Foundation cropped.svg"), w: 96, h: 23.28 },
      };
      const slot = (panel.h - 20) / allItems.length;
      allItems.forEach((item, idx) => {
        const spec = coreLogos[item.entity] || { file: findLogoFile(item.entity), w: 90, h: 28 };
        const cx = panel.x + panel.w / 2;
        const cy = panel.y + 10 + slot * idx + slot / 2;
        const logoData = imageToDataUri(spec.file);
        const link = itemLink(sectionGroup, item, cx, cy);
        const logoX = cx - spec.w / 2, logoY = cy - spec.h / 2;
        if (logoData?.type === "svg") {
          link.append("image").attr("class", "core-logo-image").attr("x", logoX).attr("y", logoY)
            .attr("width", spec.w).attr("height", spec.h)
            .attr("href", `data:image/svg+xml;base64,${Buffer.from(logoData.content).toString('base64')}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("pointer-events", "none");
        } else if (logoData?.dataUri) {
          link.append("image").attr("class", "core-logo-image").attr("x", logoX).attr("y", logoY)
            .attr("width", spec.w).attr("height", spec.h)
            .attr("href", logoData.dataUri).attr("preserveAspectRatio", "xMidYMid meet")
            .style("pointer-events", "none");
        } else {
          link.append("text").attr("class", "council-logo-text")
            .attr("x", cx).attr("y", cy + 3)
            .attr("text-anchor", "middle").attr("font-size", "8px").text(item.entity);
        }
        // Transparent hit area over the logo
        if (item.website) {
          link.append("rect").attr("x", logoX).attr("y", logoY).attr("width", spec.w).attr("height", spec.h)
            .attr("fill", "transparent").style("cursor", "pointer");
        }
      });
    } else if (panel.isNativeServices) {
      // Native Services - centered in box
      const allItems = activeSubcats.flatMap(([_, items]) => items);
      sectionGroup.attr("data-cell", "140,62");

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
        const itemY = textStartY + idx * itemSpacing;
        // the item's visual center: from the abbreviation's cap height to the second line's baseline
        const link = itemLink(sectionGroup, item, panel.x + panel.w / 2, itemY + 10);
        const data = serviceData[item.entity] || { abbrev: "", line1: item.entity, line2: "" };

        link.append("text")
          .attr("x", panel.x + panel.w / 2)
          .attr("y", itemY)
          .attr("text-anchor", "middle")
          .attr("font-size", "16px")
          .attr("font-weight", "700")
          .attr("fill", "#7b59eb")
          .text(data.abbrev);

        link.append("text")
          .attr("x", panel.x + panel.w / 2)
          .attr("y", itemY + 18)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-weight", "500")
          .attr("fill", "#ffffff")
          .text(data.line1);

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

      // Distribute rows evenly, capping the extra spacing for sections with few rows
      const minTotalRowsHeight = numRows * effectiveCellH;
      const extraSpace = availableHeight - minTotalRowsHeight;
      const maxExtraSpacing = 15; // Maximum extra spacing between rows
      const rawRowSpacing = numRows > 1 ? extraSpace / (numRows - 1) : 0;
      const rowSpacing = Math.min(rawRowSpacing, maxExtraSpacing);
      const actualCellH = effectiveCellH + rowSpacing;

      // base cell for the hover reflow: a logo plus its up-to-three-line name
      sectionGroup.attr("data-cell", "44,56").attr("data-cols", cols).attr("data-align", "top");

      allItems.forEach((item, idx) => {
        const itemRow = Math.floor(idx / cols);
        const itemCol = idx % cols;

        // Center logo within cell, using distributed spacing
        const cellCenterX = gridStartX + itemCol * effectiveCellW + effectiveCellW / 2;
        const cellCenterY = gridStartY + itemRow * actualCellH + effectiveCellH / 2;

        // Skip if cell would be outside panel bounds
        if (cellCenterY + effectiveCellH / 2 > panel.y + panel.h) {
          console.warn(`WARNING: ${item.entity} does not fit in ${panel.section} and is not drawn`);
          return;
        }

        const logoX = cellCenterX - effectiveLogoSize / 2;
        const logoY = cellCenterY - effectiveCellH / 2 + 5;  // Offset from top of cell

        const logoFile = findLogoFile(item.entity, null, item.logo);
        const logoData = imageToDataUri(logoFile);

        // the item's visual center: logo top (cell top + 5) to the bottom of a three-line name (+58)
        const link = itemLink(sectionGroup, item, cellCenterX, logoY + 27);

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

  svg.append("text").attr("class", "footer-text").attr("id", "footer-date").attr("x", leftMargin).attr("y", H - 43)
    .attr("font-size", "10px").text(`Data as of: ${dateStr}`);

  svg.append("text").attr("class", "footer-note").attr("x", leftMargin).attr("y", H - 31)
    .attr("font-size", "9px").text("Note: The list of projects is not comprehensive.");

  // Genfinity branding logo - 50% larger, aligned with section boxes
  const genfinityLogoPath = path.join(LOGOS_PATH, "branding", "genfinity-logo.svg");
  const genfinityLogo = imageToDataUri(genfinityLogoPath);
  const logoWidth = 180;  // 50% bigger (was 120)
  const logoHeight = 29;  // 50% bigger (was 19)
  const logoX = W - rightMargin - logoWidth; // Right edge aligns with section boxes (W - 70)
  const logoY = H - 35 - logoHeight;

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
