import { describe, expect, it } from "vitest";
import {
	PREVIEW_API_ORIGIN,
	PRODUCTION_API_ORIGIN,
	validateCandidateEnvironment,
	validateWorkflowInputs,
} from "../../../scripts/validate-candidate-environment.mjs";

const validPreviewEnvironment = {
	GITHUB_EVENT_NAME: "workflow_dispatch",
	WORKFLOW_MODE: "candidate",
	EXECUTION_ENVIRONMENT: "preview",
	DEPLOY_APPROVAL_API_BASE_URL: PREVIEW_API_ORIGIN,
	SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_ID: "cli_approval",
	SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_SECRET: "a".repeat(43),
	SNOW_BASE_DEPLOYMENT_RUN_CLIENT_ID: "cli_run",
	SNOW_BASE_DEPLOYMENT_RUN_CLIENT_SECRET: "b".repeat(43),
	PREVIEW_VERCEL_ORG_ID: "preview-team",
	PREVIEW_VERCEL_PROJECT_ID: "preview-project",
	PREVIEW_VERCEL_TOKEN: "preview-token",
};

const validProductionEnvironment = {
	GITHUB_EVENT_NAME: "workflow_dispatch",
	WORKFLOW_MODE: "candidate",
	EXECUTION_ENVIRONMENT: "production",
	SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_ID: "cli_approval",
	SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_SECRET: "a".repeat(43),
	SNOW_BASE_DEPLOYMENT_RUN_CLIENT_ID: "cli_run",
	SNOW_BASE_DEPLOYMENT_RUN_CLIENT_SECRET: "b".repeat(43),
	VERCEL_ORG_ID: "prod-team",
	VERCEL_PROJECT_ID: "prod-project",
	VERCEL_TOKEN: "prod-token",
};

describe("Candidate execution environment", () => {
	it("defaults legacy dispatches to production", () => {
		expect(
			validateWorkflowInputs({
				eventName: "workflow_dispatch",
				mode: "candidate",
			}),
		).toBe("production");
	});

	it("allows Preview only for Candidate mode", () => {
		expect(
			validateWorkflowInputs({
				eventName: "workflow_dispatch",
				mode: "candidate",
				executionEnvironment: "preview",
			}),
		).toBe("preview");
		for (const mode of ["selected-artifact", "legacy-break-glass"]) {
			expect(() =>
				validateWorkflowInputs({
					eventName: "workflow_dispatch",
					mode,
					executionEnvironment: "preview",
				}),
			).toThrow("Preview execution is allowed only for Candidate mode.");
		}
	});

	it("ignores the dispatch-only input for validation events", () => {
		expect(
			validateWorkflowInputs({
				eventName: "pull_request",
				executionEnvironment: "invalid",
			}),
		).toBeNull();
	});

	it("accepts isolated Preview credentials and the allowlisted API origin", () => {
		expect(validateCandidateEnvironment(validPreviewEnvironment)).toBe(
			"preview",
		);
	});

	it("fails closed for missing or non-allowlisted Preview origins", () => {
		for (const apiBaseUrl of [
			undefined,
			PRODUCTION_API_ORIGIN,
			"https://api-preview.whynotsnow.com/other",
		]) {
			expect(() =>
				validateCandidateEnvironment({
					...validPreviewEnvironment,
					DEPLOY_APPROVAL_API_BASE_URL: apiBaseUrl,
				}),
			).toThrow(/DEPLOY_APPROVAL_API_BASE_URL/);
		}
	});

	it("requires Preview Vercel project credentials before Candidate jobs can proceed", () => {
		for (const missingKey of [
			"PREVIEW_VERCEL_ORG_ID",
			"PREVIEW_VERCEL_PROJECT_ID",
			"PREVIEW_VERCEL_TOKEN",
		]) {
			const incomplete = { ...validPreviewEnvironment };
			delete incomplete[missingKey as keyof typeof incomplete];
			expect(() => validateCandidateEnvironment(incomplete)).toThrow(
				`Missing required value: ${missingKey}`,
			);
		}
	});

	it("requires both scoped Preview OAuth clients before making Candidate writes", () => {
		for (const missingKey of [
			"SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_ID",
			"SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_SECRET",
			"SNOW_BASE_DEPLOYMENT_RUN_CLIENT_ID",
			"SNOW_BASE_DEPLOYMENT_RUN_CLIENT_SECRET",
		]) {
			const incomplete = { ...validPreviewEnvironment };
			delete incomplete[missingKey as keyof typeof incomplete];
			expect(() => validateCandidateEnvironment(incomplete)).toThrow(
				`Missing required value: ${missingKey}`,
			);
		}
		expect(() =>
			validateCandidateEnvironment({
				...validPreviewEnvironment,
				SNOW_BASE_DEPLOYMENT_RUN_CLIENT_ID:
					validPreviewEnvironment.SNOW_BASE_DEPLOYMENT_APPROVAL_CLIENT_ID,
			}),
		).toThrow("Candidate OAuth clients must have distinct roles.");
	});

	it("preserves the production endpoint default and rejects Preview overrides", () => {
		expect(validateCandidateEnvironment(validProductionEnvironment)).toBe(
			"production",
		);
		const legacyProductionDispatch: Record<string, string | undefined> = {
			...validProductionEnvironment,
		};
		delete legacyProductionDispatch.EXECUTION_ENVIRONMENT;
		expect(validateCandidateEnvironment(legacyProductionDispatch)).toBe(
			"production",
		);
		expect(() =>
			validateCandidateEnvironment({
				...validProductionEnvironment,
				DEPLOY_APPROVAL_API_BASE_URL: PREVIEW_API_ORIGIN,
			}),
		).toThrow(
			"API origin is not allowlisted: DEPLOY_APPROVAL_API_BASE_URL",
		);
	});
});
