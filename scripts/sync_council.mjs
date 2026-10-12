#!/usr/bin/env node
// Hedera Council sync: https://hederacouncil.org is the source of truth for three sections of the map.
//
//   hederacouncil.org tab   ->  map section (CSV "Section")   CSV "Type_or_Role"
//   Council Members         ->  Hedera Council                 Council Member
//   Strategic Partners      ->  Strategic Partners             Strategic Partner
//   Community Partners      ->  Community Partners             Community Partner
//
// For each section the script:
//   - adds every organization the tab lists that the section lacks (logo downloaded from hederacouncil.org;
//     the white artwork when the site has one, since the map is dark),
//   - removes rows the tab no longer lists (an organization that also sits in another section keeps that row),
//   - replaces a logo when the file hederacouncil.org shows for it changes.
// The logo each organization had on hederacouncil.org is kept in scripts/council-state.json, the baseline for
// spotting a changed logo. Reruns with nothing new write nothing.
//
// hederacouncil.org is a SvelteKit site. Its grid is built from a data array in the page's JS chunks, one object
// per organization: {id, name, headquarters, sector, memberSince, logoSrc, logoSrcWhite?} plus isStrategicPartner /
// isCommunityPartner flags. That array is the structured source; the server-rendered member grid
// (<img alt="<Name> logo">) is the cross-check. A parse that finds far fewer organizations than the CSV has is
// treated as a failure (exit 2), never as a mass removal.
//
// Usage: node scripts/sync_council.mjs [--dry-run] [--report out.json]
// Exit codes: 0 ok (changed or not), 2 the site could not be fetched or parsed.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CSV_PATH = path.join(ROOT, "data", "hedera_ecosystem_master.csv");
const LOGO_DIR = path.join(ROOT, "logos", "council");
const STATE_PATH = path.join(HERE, "council-state.json");
const SITE = "https://hederacouncil.org";
const MIN_SHARE = 0.8; // a parsed list more than 20% shorter than ours is a parse failure, not a mass exit

const SECTIONS = [
  { tab: "Council Members", section: "Hedera Council", role: "Council Member", pick: (o) => !o.isStrategicPartner && !o.isCommunityPartner },
  { tab: "Strategic Partners", section: "Strategic Partners", role: "Strategic Partner", pick: (o) => !!o.isStrategicPartner },
  { tab: "Community Partners", section: "Community Partners", role: "Community Partner", pick: (o) => !!o.isCommunityPartner },
];

// Reviewed aliases: hederacouncil.org name (normalized) -> the name the map already uses (normalized).
const ALIASES = {
  aberdeen: "abrdn", // hederacouncil.org still uses the old brand name
  lg: "lg electronics",
  nse: "nairobi securities exchange",
};

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const reportPath = args.includes("--report") ? args[args.indexOf("--report") + 1] : null;

class SourceError extends Error {}

const SUFFIXES = new Set(["inc", "ltd", "llc", "plc", "group", "labs", "corp", "corporation", "co", "limited", "ag", "sa", "gmbh", "holdings"]);
export function norm(name) {
  const words = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  while (words.length > 1 && SUFFIXES.has(words[words.length - 1])) words.pop();
  const n = words.join(" ");
  return ALIASES[n] ?? n;
}

async function get(url, binary = false) {
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "hederamap-council-sync (+https://hederamap.com)" }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return binary ? Buffer.from(await r.arrayBuffer()) : await r.text();
    } catch (e) { last = e; await new Promise((res) => setTimeout(res, 1500 * (i + 1))); }
  }
  throw new SourceError(`${url}: ${last?.message ?? last}`);
}

const parseProps = (lit) => {
  const o = {};
  for (const m of lit.matchAll(/([A-Za-z_$][\w$]*):("(?:[^"\\]|\\.)*"|!0|!1|-?\d+(?:\.\d+)?)/g)) {
    const v = m[2];
    o[m[1]] = v === "!0" ? true : v === "!1" ? false : v.startsWith('"') ? JSON.parse(v) : Number(v);
  }
  return o;
};

export async function fetchCouncil() {
  const html = await get(SITE);
  const grid = [...html.matchAll(/<img[^>]*\balt="([^"]*?) logo"/g)].map((m) => m[1].replace(/&amp;/g, "&").trim());
  const scripts = [...new Set([...html.matchAll(/["'](\.?\/?_app\/immutable\/(?:nodes|chunks|entry)\/[^"']+\.js)["']/g)].map((x) => new URL(x[1], SITE).href))].sort();
  const orgs = new Map();
  for (const src of scripts) {
    const js = await get(src);
    for (const m of js.matchAll(/\{id:"[^"]*",name:"(?:[^"\\]|\\.)*"(?:,[A-Za-z_$][\w$]*:(?:"(?:[^"\\]|\\.)*"|!0|!1|-?\d+(?:\.\d+)?))*\}/g)) {
      const o = parseProps(m[0]);
      if (o.name && o.logoSrc && !orgs.has(o.id)) orgs.set(o.id, o);
    }
  }
  const all = [...orgs.values()];
  const out = {};
  for (const s of SECTIONS) {
    out[s.section] = all.filter(s.pick).map((o) => ({
      name: o.name.trim(),
      since: o.memberSince ?? null,
      // white artwork first: the map is dark
      logos: [o.logoSrcWhite, o.logoSrc].filter(Boolean).map((u) => new URL(u, SITE).href),
    }));
  }
  const notes = [];
  if (grid.length) {
    const g = new Set(grid.map(norm));
    // the server-rendered grid is the Council Members tab only (the partner tabs render on click)
    const missing = out["Hedera Council"].filter((o) => !g.has(norm(o.name))).map((o) => o.name);
    if (missing.length) notes.push(`council members in the data array but not in the page grid: ${missing.join(", ")}`);
  }
  if (!out["Hedera Council"].length) throw new SourceError(`${SITE}: no council members found (layout changed?)`);
  return { sections: out, notes, method: `structured data array in ${scripts.length} script chunks` };
}

const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const readJson = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);

function readCsv() {
  const text = fs.readFileSync(CSV_PATH, "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const fields = parsed.meta.fields;
  if (!fields.includes("Logo")) fields.push("Logo");
  return { rows: parsed.data, fields, text };
}
function writeCsv(rows, fields) {
  return Papa.unparse({ fields, data: rows.map((r) => fields.map((f) => r[f] ?? "")) }, { newline: "\r\n" }) + "\r\n";
}

const fileFor = (url) => path.basename(new URL(url).pathname);

export async function runSync({ log = console.log } = {}) {
  const site = await fetchCouncil();
  const { rows, fields, text } = readCsv();
  const state = readJson(STATE_PATH, {});
  const report = { method: site.method, notes: site.notes, sections: {} };
  let next = [...rows];

  for (const s of SECTIONS) {
    const listed = site.sections[s.section];
    const ours = next.filter((r) => r.Section === s.section);
    if (ours.length && listed.length < Math.ceil(ours.length * MIN_SHARE))
      throw new SourceError(`${SITE}: ${s.tab} lists ${listed.length} against ${ours.length} on our map (a drop of more than ${Math.round((1 - MIN_SHARE) * 100)}% is treated as a parse failure)`);
    const r = (report.sections[s.section] = { tab: s.tab, siteCount: listed.length, added: [], removed: [], logoChanged: [], renamed: [] });
    const listedBy = new Map(listed.map((o) => [norm(o.name), o]));
    // removals
    for (const row of ours) {
      if (!listedBy.has(norm(row.Entity))) {
        next = next.filter((x) => x !== row);
        r.removed.push(row.Entity);
      }
    }
    // additions and logo changes
    for (const o of listed) {
      const key = `${s.section}::${norm(o.name)}`;
      let row = next.find((x) => x.Section === s.section && norm(x.Entity) === norm(o.name));
      const prev = state[key];
      const isNew = !row;
      const url = o.logos[0];
      const bytes = await get(url, true);
      const hash = sha(bytes);
      // a recorded logo that hederacouncil.org now serves differently (new file or new bytes)
      // names follow hederacouncil.org's spelling exactly (owner, 2026-10-12)
      if (!isNew && row.Entity !== o.name) { r.renamed.push({ from: row.Entity, to: o.name }); row.Entity = o.name; }
      const logoChanged = !isNew && !!row.Logo && !!prev && (prev.url !== url || prev.sha !== hash);
      if (isNew) {
        // reuse what the map already knows about the organization (its website) from any other section
        const elsewhere = next.find((x) => norm(x.Entity) === norm(o.name));
        row = { Entity: o.name, Section: s.section, Type_or_Role: s.role, Tier: "Tier 1", Status: "Active", Primary_Source: "hederacouncil.org", Website: elsewhere?.Website ?? "", Logo: "" };
        next.push(row);
      }
      // the logo is written for a new organization, a changed logo, and a row without one; a row that already
      // has a logo and no recorded baseline only gets the baseline recorded (its current file is kept)
      if (isNew || logoChanged || !row.Logo) {
        const file = fileFor(url);
        if (!DRY) fs.writeFileSync(path.join(LOGO_DIR, file), bytes);
        if (logoChanged) r.logoChanged.push({ name: row.Entity, from: prev.url, to: url });
        row.Logo = `council/${file}`;
      }
      state[key] = { name: o.name, url, sha: hash, since: o.since };
      if (isNew) r.added.push({ name: o.name, logo: o.logos[0], website: row.Website || null });
    }
    // keep each section together and alphabetical, as hederacouncil.org shows it
    const sec = next.filter((x) => x.Section === s.section).sort((a, b) => a.Entity.localeCompare(b.Entity, "en", { sensitivity: "base" }));
    const first = next.findIndex((x) => x.Section === s.section);
    if (first !== -1) {
      const rest = next.filter((x) => x.Section !== s.section);
      const before = next.slice(0, first).filter((x) => x.Section !== s.section).length;
      next = [...rest.slice(0, before), ...sec, ...rest.slice(before)];
    }
    for (const key of Object.keys(state)) if (key.startsWith(`${s.section}::`) && !listedBy.has(key.slice(s.section.length + 2))) delete state[key];
  }

  const csvOut = writeCsv(next, fields);
  const csvChanged = csvOut !== text;
  const stateOut = JSON.stringify(state, null, 1) + "\n";
  const stateChanged = !fs.existsSync(STATE_PATH) || fs.readFileSync(STATE_PATH, "utf8") !== stateOut;
  if (!DRY) {
    if (csvChanged) fs.writeFileSync(CSV_PATH, csvOut);
    if (stateChanged) fs.writeFileSync(STATE_PATH, stateOut);
  }
  report.changed = Object.values(report.sections).some((r) => r.added.length || r.removed.length || r.logoChanged.length || r.renamed.length);
  for (const [name, r] of Object.entries(report.sections))
    log(`${name} (${r.tab}): ${r.siteCount} on hederacouncil.org; added [${r.added.map((a) => a.name).join(", ")}], removed [${r.removed.join(", ")}], logo changes [${r.logoChanged.map((c) => c.name).join(", ")}], renamed [${r.renamed.map((x) => `${x.from} -> ${x.to}`).join(", ")}]`);
  for (const n of site.notes) log(`note: ${n}`);
  log(`parse: ${site.method}${DRY ? " (dry run, nothing written)" : ""}`);
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(report, null, 1) + "\n");
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runSync().catch((e) => {
    console.error(e instanceof SourceError ? `source error: ${e.message}` : e);
    process.exit(2);
  });
}
