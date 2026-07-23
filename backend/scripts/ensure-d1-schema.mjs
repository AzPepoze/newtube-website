import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(
    backendDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "wrangler.cmd" : "wrangler",
);
const target = process.argv.includes("--remote") ? "--remote" : "--local";

async function execute(args) {
    const { stdout } = await execFileAsync(wrangler, ["d1", "execute", "DB", target, ...args], {
        cwd: backendDir,
    });
    return stdout;
}

async function main() {
    const tableInfoOutput = await execute([
        "--command",
        "PRAGMA table_info(Users);",
        "--json",
    ]);
    const tableInfo = JSON.parse(tableInfoOutput);
    const columns = tableInfo[0]?.results ?? [];

    if (columns.length === 0) {
        console.log("Users table is absent; bootstrapping the current schema.");
    } else if (!columns.some((column) => column.name === "is_admin")) {
        console.log("Adding the missing Users.is_admin column.");
        await execute([
            "--command",
            "ALTER TABLE Users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;",
        ]);
    } else {
        console.log("Users.is_admin already exists.");
    }

    await execute(["--file", "schema.sql"]);
    console.log(`D1 schema is current (${target.slice(2)}).`);
}

main().catch((error) => {
    console.error("D1 migration failed:", error.stderr || error.message || error);
    process.exitCode = 1;
});
