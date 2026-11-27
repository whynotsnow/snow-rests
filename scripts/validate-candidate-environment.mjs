import { pathToFileURL } from "node:url";

export const PRODUCTION_API_ORIGIN = "https://api.whynotsnow.com";
export const PREVIEW_API_ORIGIN = "https://api-preview.whynotsnow.com";

const MODES = new Set(["candidate", "selected-artifact", "legacy-break-glass"]);
const EXECUTION_ENVIRONMENTS = new Set(["production", "preview"]);

/** @param {string | undefined} value @param {string} name */
function required(value, name) {
	if (!value?.trim()) throw new Error(`Missing required value: ${name}`);
	return value.trim();
}

/** @param {string | undefined} value @param {string} name */
function requiredOAuthClientId(value, name) {
	const clientId = required(value, name);
	if (!/^cli_[A-Za-z0-9_-]{1,128}$/u.test(clientId))
		throw new Error(`Invalid client ID format: ${name}`);
	return clientId;
}

/** @param {string | undefined} value @param {string} name */
function requiredClientSecret(value, name) {
	const secret = required(value, name);
	if (!/^[A-Za-z0-9_-]{43}$/u.test(secret))
		throw new Error(`Invalid client secret format: ${name}`);
	return secret;
}

/** @param {string} value @param {string} expectedOrigin @param {string} name */
function requireAllowedOrigin(value, expectedOrigin, name) {
	let parsed;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error(`Invalid API origin: ${name}`);
	}
	if (
		parsed.origin !== expectedOrigin ||
		parsed.pathname !== "/" ||
		parsed.search ||
		parsed.hash ||
		parsed.username ||
		parsed.password
	)
		throw new Error(`API origin is not allowlisted: ${name}`);
}

/**
 * @param {{ eventName?: string; mode?: string; executionEnvironment?: string }} input
 * @returns {"production" | "preview" | null}
 */
export function validateWorkflowInputs(input) {
	if (input.eventName !== "workflow_dispatch") return null;
	const mode = input.mode || "candidate";
	const executionEnvironment = input.executionEnvironment || "production";
	if (!MODES.has(mode)) throw new Error("Unsupported workflow mode.");
	if (!EXECUTION_ENVIRONMENTS.has(executionEnvironment))
		throw new Error("Unsupported execution environment.");
	if (mode !== "candidate" && executionEnvironment !== "production")
		throw new Error(
			"Preview execution is allowed only for Candidate mode.",
		);
	return /** @type {"production" | "preview"} */ (executionEnvironment);
}

/** @param {Record<string, string | undefined>} env */
export function validateCandidateEnvironment(env) {
	const executionEnvironment = validateWorkflowInputs({
		eventName: env.GITHUB_EVENT_NAME,
		mode: env.WORKFLOW_MODE,
		executionEnvironment: env.EXECUTION_ENVIRONMENT,
	});
	if (executionEnvironment === null || env.WORKFLOW_MODE !== "candidate")
		throw new Error("Candidate preflight requires a Candidate dispatch.");

	const apiBaseUrl = env.DEPLOY_APPROVAL_API_BASE_URL?.trim();
	const approvalClientId = requiredOAuthClientId(
		env.SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_ID,
		"SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_ID",
	);
	const runClientId = requiredOAuthClientId(
		env.SNOW_BASE_DEPLOYMENT_RUN_CLIENT_ID,
		"SNOW_BASE_DEPLOYMENT_RUN_CLIENT_ID",
	);
	if (approvalClientId === runClientId)
		throw new Error("Candidate OAuth clients must have distinct roles.");
	requiredClientSecret(
		env.SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_SECRET,
		"SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_SECRET",
	);
	requiredClientSecret(
		env.SNOW_BASE_DEPLOYMENT_RUN_CLIENT_SECRET,
		"SNOW_BASE_DEPLOYMENT_RUN_CLIENT_SECRET",
	);

	if (executionEnvironment === "preview") {
		if (!apiBaseUrl)
			throw new Error(
				"Missing required value: DEPLOY_APPROVAL_API_BASE_URL",
			);
		requireAllowedOrigin(
			apiBaseUrl,
			PREVIEW_API_ORIGIN,
			"DEPLOY_APPROVAL_API_BASE_URL",
		);
		required(env.PREVIEW_VERCEL_ORG_ID, "PREVIEW_VERCEL_ORG_ID");
		required(env.PREVIEW_VERCEL_PROJECT_ID, "PREVIEW_VERCEL_PROJECT_ID");
		required(env.PREVIEW_VERCEL_TOKEN, "PREVIEW_VERCEL_TOKEN");
		return executionEnvironment;
	}

	requireAllowedOrigin(
		apiBaseUrl || PRODUCTION_API_ORIGIN,
		PRODUCTION_API_ORIGIN,
		"DEPLOY_APPROVAL_API_BASE_URL",
	);
	required(env.VERCEL_ORG_ID, "VERCEL_ORG_ID");
	required(env.VERCEL_PROJECT_ID, "VERCEL_PROJECT_ID");
	required(env.VERCEL_TOKEN, "VERCEL_TOKEN");
	return /** @type {"production" | "preview"} */ (executionEnvironment);
}

function main() {
	try {
		if (process.argv.includes("--inputs-only")) {
			validateWorkflowInputs({
				eventName: process.env.GITHUB_EVENT_NAME,
				mode: process.env.WORKFLOW_MODE,
				executionEnvironment: process.env.EXECUTION_ENVIRONMENT,
			});
			console.log("Workflow execution environment is valid.");
			return;
		}
		const environment = validateCandidateEnvironment(process.env);
		console.log(`Candidate ${environment} preflight passed.`);
	} catch (error) {
		console.error(
			`[candidate-preflight] ${error instanceof Error ? error.message : "Validation failed."}`,
		);
		process.exitCode = 1;
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
	main();
