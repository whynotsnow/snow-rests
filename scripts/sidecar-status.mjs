import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
function git(...args) {
	const result = spawnSync("git", args, {
		cwd: scriptDirectory,
		encoding: "utf8",
	});
	return result.status === 0 ? result.stdout.trim() : null;
}

const projectRoot = git("rev-parse", "--show-toplevel") || process.cwd();
const commonDirectory = git(
	"rev-parse",
	"--path-format=absolute",
	"--git-common-dir",
);
const primaryRoot =
	commonDirectory && basename(commonDirectory) === ".git"
		? dirname(commonDirectory)
		: projectRoot;
const name = basename(primaryRoot);
const envKey = name.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_SIDECAR_PATH";
const override =
	process.env.SIDECAR_PATH?.trim() || process.env[envKey]?.trim();
const defaults = [
	resolve(projectRoot, "..", name + ".sidecar"),
	resolve(primaryRoot, "..", name + ".sidecar"),
];
const roots = override ? [resolve(projectRoot, override)] : defaults;
const root = roots.find((candidate) =>
	existsSync(resolve(candidate, "sidecar.config.json")),
);
const args = process.argv.slice(2);

function fail(message) {
	if (args.includes("--json")) {
		console.log(
			JSON.stringify({
				ok: false,
				schemaVersion: 3,
				executable: [],
				blocked: [],
				diagnostics: { errors: [message] },
			}),
		);
	} else {
		console.error(message);
	}
	process.exit(1);
}

if (!root) fail("Sidecar directory was not found.");
const runtime = [root, ...defaults]
	.map((directory) => resolve(directory, "tools/sidecar/status_sidecar.py"))
	.find((candidate) => existsSync(candidate));
if (!runtime)
	fail("Install the Sidecar v3.2 tooling in the active adjacent repository.");
const child = spawnSync(
	process.env.SIDECAR_PYTHON || "python3",
	["-B", runtime, root, ...args],
	{ stdio: "inherit" },
);
if (child.error) fail("Could not start Python for the Sidecar status command.");
process.exitCode = child.status ?? 1;
