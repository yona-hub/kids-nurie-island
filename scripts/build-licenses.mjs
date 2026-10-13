import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const lock = JSON.parse(
  await fs.readFile(path.join(root, "package-lock.json"), "utf8"),
);
const packages = Object.entries(lock.packages).filter(
  ([location, data]) =>
    // Vite injects its preload helper into the shipped client bundle even
    // though the package itself is a development dependency.
    location &&
    (!data.dev ||
      /node_modules\/workbox-/.test(location) ||
      location === "node_modules/vite"),
);
const list = [],
  texts = [];
for (const [location, data] of packages) {
  const folder = path.join(root, location);
  const metadata = JSON.parse(
    await fs.readFile(path.join(folder, "package.json"), "utf8"),
  );
  const license =
    typeof metadata.license === "string"
      ? metadata.license
      : (data.license ?? "SEE LICENSE");
  if (
    !/^(MIT|ISC|BSD-2-Clause|BSD-3-Clause|Apache-2.0|0BSD|UNLICENSED)$/.test(
      license,
    )
  )
    throw new Error(`Review license: ${metadata.name}: ${license}`);
  const repository =
    typeof metadata.repository === "string"
      ? metadata.repository
      : metadata.repository?.url;
  const url = repository?.replace(/^git\+/, "").replace(/\.git$/, "");
  list.push({
    name: metadata.name,
    version: metadata.version,
    license,
    ...(/^https:\/\//.test(url ?? "") ? { url } : {}),
  });
  const files = (await fs.readdir(folder)).filter((file) =>
    /^(license|licence|copying|notice)(\.|$)/i.test(file),
  );
  if (!files.length) throw new Error(`Missing license text: ${metadata.name}`);
  texts.push(
    `${metadata.name} ${metadata.version} — ${license}\n\n${(await Promise.all(files.map((file) => fs.readFile(path.join(folder, file), "utf8")))).join("\n\n")}`,
  );
}
const output = path.join(root, "apps/web/public/legal");
list.push({
  name: "Google Sans",
  version: "v71 (Google sign-in subset)",
  license: "OFL-1.1",
  url: "https://github.com/googlefonts/googlesans",
});
texts.push(`Google Sans — Copyright 2025 The Google Sans Project Authors\n\n${await fs.readFile(path.join(root, "content/third-party/google-signin/OFL.txt"), "utf8")}`);
list.push({
  name: "Google Identity button styles",
  version: "2026-10-07 (adapted)",
  license: "Apache-2.0",
  url: "https://developers.google.com/identity/branding-guidelines",
});
texts.push(`Google Developers — Sign in with Google HTML button styles (adapted for Japanese, 54px target, local font and React).\nSource: https://developers.google.com/identity/branding-guidelines\n\n${await fs.readFile(path.join(root, "content/third-party/google-signin/Apache-2.0.txt"), "utf8")}`);
await fs.mkdir(output, { recursive: true });
await fs.writeFile(
  path.join(output, "oss.json"),
  JSON.stringify(
    list.sort((a, b) => a.name.localeCompare(b.name)),
    null,
    2,
  ) + "\n",
);
await fs.writeFile(
  path.join(output, "third-party-notices.txt"),
  texts.join(
    "\n\n============================================================\n\n",
  ),
);
console.log(
  `Generated full license notices for ${list.length} shipped packages.`,
);
