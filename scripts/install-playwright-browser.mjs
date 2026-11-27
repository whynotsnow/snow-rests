import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** @param {string} osRelease */
export function getAmazonLinuxBrowserDependencyCommand(osRelease) {
	const fields = Object.fromEntries(
		osRelease.split(/\r?\n/u).flatMap((line) => {
			const match = /^([A-Z_]+)=(.*)$/u.exec(line);
			if (!match) return [];
			return [[match[1], match[2].replace(/^["']|["']$/gu, "")]];
		}),
	);

	if (fields.ID !== "amzn" || fields.VERSION_ID !== "2023") return null;
	return ["dnf", "install", "-y", "nspr", "nss"];
}

/** @param {string} command @param {string[]} args */
function run(command, args) {
	const result = spawnSync(command, args, { stdio: "inherit" });
	if (result.error) throw result.error;
	if (result.status !== 0)
		throw new Error(`${command} exited with status ${result.status}`);
}

function main() {
	if (process.platform === "linux") {
		const osRelease = readFileSync("/etc/os-release", "utf8");
		const dependencyCommand =
			getAmazonLinuxBrowserDependencyCommand(osRelease);
		if (dependencyCommand)
			run(dependencyCommand[0], dependencyCommand.slice(1));
	}
	run("pnpm", ["exec", "playwright", "install", "chromium"]);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		main();
	} catch (error) {
		console.error(
			`[playwright-install] ${error instanceof Error ? error.message : error}`,
		);
		process.exitCode = 1;
	}
}
