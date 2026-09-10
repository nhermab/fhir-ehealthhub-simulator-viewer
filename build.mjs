import { cp, mkdir } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await cp("index.html", "dist/index.html");
await cp("src", "dist/src", { recursive: true });
await cp("public", "dist", { recursive: true });
console.log(
  "Static client built in dist/. For the local proxy, run npm start; static hosting supports demo and direct mode.",
);
