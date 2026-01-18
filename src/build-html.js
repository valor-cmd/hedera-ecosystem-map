import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const ROOT = process.cwd();
const CSV_PATH = path.join(ROOT, "data", "hedera_ecosystem_master.csv");
const LOGOS_PATH = path.join(ROOT, "logos");
const HTML_TEMPLATE = path.join(ROOT, "dist", "hedera-map.html");
const SVG_FILE = path.join(ROOT, "dist", "hedera-map.svg");
const OUT_HTML = path.join(ROOT, "dist", "hedera-ecosystem.html");

// Sections config matching render.js - order for mobile display
const SECTIONS = [
  { name: "Independent Core Organizations", subcategories: ["Core Organization"] },
  { name: "Hedera Council", subcategories: ["Council Member"] },
  { name: "Native Services", subcategories: ["Native Service"] },
  { name: "DeFi", subcategories: ["DEX", "Lending", "Staking", "Suite"] },
  { name: "NFT Markets", subcategories: ["NFT Platform", "NFT Marketplace"] },
  { name: "Gaming & Entertainment", subcategories: ["Gaming", "Music"] },
  { name: "Real World Assets", subcategories: ["Commodities", "Real Estate", "Carbon Credits", "Security Tokens", "RWA DeFi", "Exchange", "Environmental"] },
  { name: "Meme Tokens", subcategories: ["Meme Token"] },
  { name: "Wallets", subcategories: ["Wallet"] },
  { name: "Custodians", subcategories: ["Custodian"] },
  { name: "Exchanges", subcategories: ["Exchange"] },
  { name: "Bridges and Interoperability", subcategories: ["Bridge", "Interoperability"] },
  { name: "Services", subcategories: ["Infrastructure", "API Provider"] },
  { name: "Oracles", subcategories: ["Oracle"] },
  { name: "Onramps", subcategories: ["Onramp"] },
  { name: "Implementation Partners", subcategories: ["Partner"] },
  { name: "Advisory Firms", subcategories: ["Advisor"] },
  { name: "Risk and Compliance", subcategories: ["Compliance"] },
  { name: "Stablecoin Infrastructure", subcategories: ["Stablecoin"] },
  { name: "Tooling and Solutions", subcategories: ["Tooling"] }
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
  "Gaming and Entertainment": "Gaming & Entertainment",
  "Hedera Council": "Hedera Council",
  "Independent Core Organizations": "Independent Core Organizations",
  "Meme Tokens": "Meme Tokens",
  "Native Services": "Native Services"
};

// Logo file finder (matching render.js mappings)
function findLogoFile(entityName) {
  const specialMappings = {
    // Wallets
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
    // Bridges
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
    "HashNames": path.join(LOGOS_PATH, "DEXs", "HashNames.jpg"),
    "Hashgraph.Name": path.join(LOGOS_PATH, "DEXs", "HashNames.jpg"),
    // DeFi
    "SaucerSwap": path.join(LOGOS_PATH, "defi", "saucerswap.jpg"),
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
    "Ecogard": path.join(LOGOS_PATH, "rwas", "Ecogard.jpg"),
    "Verra Guardian": path.join(LOGOS_PATH, "rwas", "Verra Guardian.jpg"),
    "Isle Finance": path.join(LOGOS_PATH, "rwas", "Isle Finance.jpg"),
    "Gilmore Estates": path.join(LOGOS_PATH, "rwas", "Gilmore Estates.jpg"),
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
    // Infrastructure
    "EQTY Lab": path.join(LOGOS_PATH, "infrastructure", "EQTY Lab.jpg"),
    "Tashi Network": path.join(LOGOS_PATH, "infrastructure", "Tashi Network.jpg"),
    "HNS": path.join(LOGOS_PATH, "infrastructure", "HNS Hedera Naming Service.png"),
    "The Hashgraph Group": path.join(LOGOS_PATH, "infrastructure", "The Hashgraph Group.jpg"),
    // Core organizations
    "Hashgraph": path.join(LOGOS_PATH, "core", "Hashgraph full size.svg"),
    "Hedera Council": path.join(LOGOS_PATH, "core", "Hedera Council full size.svg"),
    "Hedera Foundation": path.join(LOGOS_PATH, "core", "Hedera Foundation full size.svg"),
    "The Hashgraph Association": path.join(LOGOS_PATH, "core", "The Hashgraph Assoication full size.svg"),
    "Exponential Science": path.join(LOGOS_PATH, "core", "Exponetntial Science full size.svg"),
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
  if (ext === ".svg") return `data:image/svg+xml;base64,${data.toString('base64')}`;
  const mimeTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
  return `data:${mimeTypes[ext] || "image/png"};base64,${data.toString("base64")}`;
}

function readCSV() {
  return Papa.parse(fs.readFileSync(CSV_PATH, "utf8"), { header: true, skipEmptyLines: true }).data;
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
      const entityName = row.Entity?.trim();
      const logoFile = findLogoFile(entityName);
      const logoDataUri = imageToDataUri(logoFile);

      result[displaySection].subcategories[targetSubcat].push({
        entity: entityName,
        role,
        tier: row.Tier?.trim() || "",
        status: row.Status?.trim() || "",
        website: row.Website?.trim() || "",
        logoDataUri: logoDataUri || ""
      });
    }
  });
  return result;
}

// Generate mobile HTML sections
function generateMobileSections(sectionData) {
  const nativeServiceData = {
    "Hedera Token Service": { abbrev: "HTS", name: "Token Service" },
    "Hedera Consensus Service": { abbrev: "HCS", name: "Consensus Service" },
    "Hedera Smart Contract Service": { abbrev: "HSCS", name: "Smart Contract" }
  };

  // Council logo aspect ratios (from desktop render.js)
  const councilAspectRatios = {
    "Google": 1.67, "IBM": 1.67, "Boeing": 4.3, "Deutsche Telekom": 1.67,
    "LG Electronics": 1.67, "Nomura": 1.67, "Ubisoft": 1.67, "UCL": 1.0,
    "Shinhan Bank": 1.67, "Dell": 2.18, "DLA Piper": 1.67, "EDF": 1.67,
    "eftpos": 1.0, "Hitachi": 1.67, "Mondelez": 1.67, "ServiceNow": 1.67,
    "Swirlds Labs": 1.67, "Tata Communications": 1.67, "Worldpay": 3.71,
    "Zain Group": 1.67, "LSE": 1.67, "abrdn": 1.67, "Arrow": 1.67,
    "Cofra": 1.67, "Dentons": 1.67, "IIT Madras": 1.67, "Magalu": 1.67,
    "Repsol": 4.27, "Blockchain for Energy": 2.23, "GBBC": 1.67
  };

  // Council logo size adjustments (from desktop render.js)
  const councilSizeScale = {
    "GBBC": 0.6,
    "Repsol": 0.5,
    "Boeing": 0.5,
    "Worldpay": 0.5
  };

  // Core org relative heights (from desktop render.js - scaled up for mobile 3-column layout)
  // Desktop heights: Hashgraph: 31, Hedera Council: 99, Hedera Foundation: 112, THA: 42, ExpSci: 70
  // For mobile 3-column, use larger base sizes while maintaining ratios
  const coreOrgHeights = {
    "Hashgraph": 31,           // 22 * 1.4
    "Hedera Council": 98,      // 70 * 1.4
    "Hedera Foundation": 112,  // 80 * 1.4
    "The Hashgraph Association": 42,  // 30 * 1.4
    "Exponential Science": 70  // 50 * 1.4
  };

  let html = '';

  SECTIONS.forEach(section => {
    const secData = sectionData[section.name];
    if (!secData) return;

    const items = Object.values(secData.subcategories).flat();
    if (items.length === 0) return;

    // Determine section CSS class
    let sectionClass = 'mobile-section';
    if (section.name === 'Hedera Council') sectionClass += ' council';
    else if (section.name === 'Independent Core Organizations') sectionClass += ' core-orgs';
    else if (section.name === 'Native Services') sectionClass += ' native-services';

    html += `    <div class="${sectionClass}">\n`;
    html += `      <h2 class="mobile-section-title">${section.name}</h2>\n`;
    html += `      <div class="mobile-logos">\n`;

    if (section.name === 'Native Services') {
      // Special rendering for native services
      items.forEach(item => {
        const data = nativeServiceData[item.entity] || { abbrev: item.entity.substring(0, 3).toUpperCase(), name: item.entity };
        const hasWebsite = item.website && item.website.trim() !== '';
        html += `        <a class="mobile-native-service" ${hasWebsite ? `href="${item.website}" target="_blank" rel="noopener noreferrer"` : ''}>\n`;
        html += `          <span class="mobile-native-abbrev">${data.abbrev}</span>\n`;
        html += `          <span class="mobile-native-name">${data.name}</span>\n`;
        html += `        </a>\n`;
      });
    } else if (section.name === 'Hedera Council') {
      // Council logos with custom aspect ratios and size adjustments - 3 per row
      items.forEach(item => {
        const hasWebsite = item.website && item.website.trim() !== '';
        const linkAttrs = hasWebsite ? `href="${item.website}" target="_blank" rel="noopener noreferrer"` : '';

        const aspectRatio = councilAspectRatios[item.entity] || 2.5;
        // GBBC, Repsol, Boeing, Worldpay keep their current sizes, others 75% bigger
        const sizeScale = councilSizeScale[item.entity] || 1.75;

        // Base height 45px for 3-column layout, adjusted by scale
        const baseHeight = 45 * sizeScale;
        const width = baseHeight * aspectRatio;

        html += `        <a class="mobile-logo" ${linkAttrs}>\n`;

        if (item.logoDataUri) {
          html += `          <img class="mobile-logo-img" src="${item.logoDataUri}" alt="${item.entity}" style="height: ${baseHeight}px;">\n`;
        } else {
          html += `          <div class="mobile-logo-placeholder" style="height: ${baseHeight}px;">${item.entity.substring(0, 2).toUpperCase()}</div>\n`;
        }

        html += `          <span class="mobile-logo-name">${item.entity}</span>\n`;
        html += `        </a>\n`;
      });
    } else if (section.name === 'Independent Core Organizations') {
      // Core org logos with custom heights - 3 per row
      items.forEach(item => {
        const hasWebsite = item.website && item.website.trim() !== '';
        const linkAttrs = hasWebsite ? `href="${item.website}" target="_blank" rel="noopener noreferrer"` : '';

        const height = coreOrgHeights[item.entity] || 35;
        const aspectRatio = 3.7;  // All core org logos use same aspect ratio

        html += `        <a class="mobile-logo" ${linkAttrs}>\n`;

        if (item.logoDataUri) {
          html += `          <img class="mobile-logo-img" src="${item.logoDataUri}" alt="${item.entity}" style="height:${height}px;">\n`;
        } else {
          html += `          <div class="mobile-logo-placeholder" style="height:${height}px;">${item.entity.substring(0, 2).toUpperCase()}</div>\n`;
        }

        html += `          <span class="mobile-logo-name">${item.entity}</span>\n`;
        html += `        </a>\n`;
      });
    } else {
      // Standard logo rendering
      items.forEach(item => {
        const hasWebsite = item.website && item.website.trim() !== '';
        const linkAttrs = hasWebsite ? `href="${item.website}" target="_blank" rel="noopener noreferrer"` : '';

        html += `        <a class="mobile-logo" ${linkAttrs}>\n`;

        if (item.logoDataUri) {
          html += `          <img class="mobile-logo-img" src="${item.logoDataUri}" alt="${item.entity}">\n`;
        } else {
          html += `          <div class="mobile-logo-placeholder">${item.entity.substring(0, 2).toUpperCase()}</div>\n`;
        }

        html += `          <span class="mobile-logo-name">${item.entity}</span>\n`;
        html += `        </a>\n`;
      });
    }

    html += `      </div>\n`;
    html += `    </div>\n`;
  });

  return html;
}

function main() {
  const rows = readCSV();
  const sectionData = buildSectionData(rows);

  // Read the HTML template and SVG file
  let html = fs.readFileSync(HTML_TEMPLATE, "utf8");
  const svgContent = fs.readFileSync(SVG_FILE, "utf8");

  // Generate mobile sections HTML
  const mobileSectionsHtml = generateMobileSections(sectionData);

  // Replace the placeholders with actual data
  html = html.replace(
    'SECTION_DATA_PLACEHOLDER',
    JSON.stringify(sectionData, null, 2)
  );

  // Embed the SVG content directly
  html = html.replace(
    'SVG_CONTENT_PLACEHOLDER',
    svgContent
  );

  // Add mobile sections
  html = html.replace(
    'MOBILE_SECTIONS_PLACEHOLDER',
    mobileSectionsHtml
  );

  // Add Genfinity logo to footer
  const genfinityLogoPath = path.join(LOGOS_PATH, "Genfinity-logo.svg");
  const genfinityLogoDataUri = imageToDataUri(genfinityLogoPath);
  html = html.replace('GENFINITY_LOGO_PLACEHOLDER', genfinityLogoDataUri);

  // Write the output HTML
  fs.writeFileSync(OUT_HTML, html, "utf8");
  console.log(`Wrote ${OUT_HTML}`);
}

main();
