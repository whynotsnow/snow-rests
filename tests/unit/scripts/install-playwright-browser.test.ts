import { describe, expect, it } from "vitest";
import { getAmazonLinuxBrowserDependencyCommand } from "../../../scripts/install-playwright-browser.mjs";

describe("Playwright browser system dependencies", () => {
	it("uses dnf packages only for Amazon Linux 2023", () => {
		expect(
			getAmazonLinuxBrowserDependencyCommand(
				'NAME="Amazon Linux"\nID="amzn"\nVERSION_ID="2023"\n',
			),
		).toEqual(["dnf", "install", "-y", "nspr", "nss"]);
	});

	it("reuses preinstalled dependencies on Ubuntu Actions runners", () => {
		expect(
			getAmazonLinuxBrowserDependencyCommand(
				'NAME="Ubuntu"\nID=ubuntu\nVERSION_ID="24.04"\n',
			),
		).toBeNull();
	});
});
