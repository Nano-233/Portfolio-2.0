const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/css/styles.css"), "utf8");
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");

let problems = 0;
const fail = (m) => { problems++; console.log("FAIL " + m); };
const ok = (m) => console.log("ok   " + m);

const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (m) => m[1]);
const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
dupes.length ? fail("duplicate html ids: " + dupes.join(",")) : ok("html ids unique (" + ids.length + ")");

const anchors = Array.from(new Set(Array.from(html.matchAll(/href="#([^"]+)"/g), (m) => m[1])));
const missingAnchors = anchors.filter((a) => !ids.includes(a));
missingAnchors.length ? fail("dead anchors: " + missingAnchors.join(",")) : ok("all in-page anchors resolve");

for (const asset of ["assets/css/styles.css", "assets/js/data.js", "assets/js/app.js", "assets/favicon.svg"]) {
  const t = path.join(root, asset);
  fs.existsSync(t) ? ok("asset " + asset + " (" + fs.statSync(t).size + "b)") : fail("missing " + asset);
}

(css.match(/{/g) || []).length === (css.match(/}/g) || []).length ? ok("css braces balanced") : fail("css brace mismatch");
!/url\((?!['"]?data:)/.test(css) ? ok("css has no external url()") : fail("css references external asset");

global.window = {};
require(path.join(root, "assets/js/data.js"));
const data = global.window.PORTFOLIO;
data && Array.isArray(data.projects) ? ok("projects loaded (" + data.projects.length + ")") : fail("PORTFOLIO.projects missing");

const pids = data.projects.map((p) => p.id);
pids.filter((v, i) => pids.indexOf(v) !== i).length ? fail("duplicate project ids") : ok("project ids unique");

const catIds = data.categories.map((c) => c.id);
const badCats = data.projects.filter((p) => !catIds.includes(p.category)).map((p) => p.id);
badCats.length ? fail("undeclared category: " + badCats.join(",")) : ok("all categories declared");

const emptyCats = catIds.filter((c) => !data.projects.some((p) => p.category === c));
emptyCats.length ? fail("empty filter categories: " + emptyCats.join(",")) : ok("every filter has projects");

const vis = ["public", "private", "local"];
const badVis = data.projects.filter((p) => !vis.includes(p.visibility)).map((p) => p.id);
badVis.length ? fail("bad visibility: " + badVis.join(",")) : ok("visibility valid on all projects");

const privateWithPublicLinks = data.projects.filter(
  (p) => p.visibility !== "public" && (p.links || []).some((l) => l.kind === "repo")
);
privateWithPublicLinks.length
  ? fail("private/local projects linking a repo: " + privateWithPublicLinks.map((p) => p.id).join(","))
  : ok("no private project exposes a repo link");

for (const p of data.projects) {
  if (!p.title || !p.summary || !p.year || !Array.isArray(p.stack) || !p.stack.length) fail("incomplete: " + p.id);
  if (p.summary && !/[.!]$/.test(p.summary.trim())) fail("summary not a sentence: " + p.id);
  for (const l of p.links || []) if (!/^https:\/\//.test(l.href)) fail("non-https link in " + p.id);
}
ok("project shape checked");

const hooks = ["project-grid", "result-count", "theme-toggle", "year", "filter-input", "stack-chips", "palette", "project-sheet", "stats", "toast"];
for (const h of hooks) {
  if (!ids.includes(h)) fail("index.html missing #" + h);
  else if (!app.includes(h)) fail("app.js never references #" + h);
}
ok("all hooks wired (" + hooks.length + ")");

const knownLinks = data.projects.flatMap((p) => (p.links || []).map((l) => l.href));
const githubLinks = knownLinks.filter((h) => h.includes("github.com/Nano-233/"));
ok("outbound links: " + knownLinks.length + " (" + githubLinks.length + " github repos)");

console.log(problems ? "\n" + problems + " problem(s)" : "\nall checks passed");
process.exit(problems ? 1 : 0);
