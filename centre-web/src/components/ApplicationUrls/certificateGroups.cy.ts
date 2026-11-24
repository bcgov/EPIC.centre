import dayjs from "dayjs";
import { ApplicationUrl } from "@/models/ApplicationUrl";
import {
  buildCertificateIndex,
  getManagedCertificates,
  groupAndSortApps,
} from "./certificateGroups";
import { getExpiryInfo, isPlatformManagedHost } from "./sslUtils";

let nextId = 1;
const row = (
  app_name: string,
  environment: string,
  url: string,
  fields: Partial<ApplicationUrl> = {},
): ApplicationUrl => ({
  id: nextId++,
  app_name,
  environment,
  url,
  ssl_expiry: null,
  ssl_status: null,
  ssl_error_message: null,
  ticket_reference: null,
  renewal_status: "NONE",
  renewal_comments: null,
  last_checked: null,
  is_active: true,
  ...fields,
});

const PLATFORM_HOST = "https://eao-dev.apps.gold.devops.gov.bc.ca";
const SHARED_HOST = "https://system.eao.gov.bc.ca";

describe("certificate groups", () => {
  it("leaves hosts the platform renews out of the certificates we manage", () => {
    const { certificateGroups } = buildCertificateIndex([
      row("EPIC Centre", "DEV", PLATFORM_HOST),
      row("EPIC Track", "DEV", `${PLATFORM_HOST}/track`),
      row("EPIC Centre", "PROD", `${SHARED_HOST}/`),
      row("EPIC Submit", "PROD", "https://submit.eao.gov.bc.ca"),
    ]);

    expect(getManagedCertificates(certificateGroups).map((group) => group.host)).to.deep.equal([
      "submit.eao.gov.bc.ca",
      "system.eao.gov.bc.ca",
    ]);
    // One platform certificate, though two URLs use it
    expect(certificateGroups.filter((group) => group.isPlatformManaged)).to.have.length(1);
  });

  it("still tracks a host that only has path routes", () => {
    const compliance = row("EPIC Compliance", "PROD", `${SHARED_HOST}/compliance`);
    const track = row("EPIC Track", "PROD", `${SHARED_HOST}/track`);
    const { certificateGroups, rowMeta } = buildCertificateIndex([track, compliance]);

    expect(getManagedCertificates(certificateGroups).map((group) => group.host)).to.deep.equal([
      "system.eao.gov.bc.ca",
    ]);
    expect(rowMeta.get(compliance.id)?.inherited).to.equal(false);
    expect(rowMeta.get(track.id)?.inherited).to.equal(true);
  });

  it("marks path routes as inheriting from the bare host", () => {
    const centre = row("EPIC Centre", "PROD", `${SHARED_HOST}/`);
    const track = row("EPIC Track", "PROD", `${SHARED_HOST}/track`);
    const { rowMeta } = buildCertificateIndex([track, centre]);

    expect(rowMeta.get(track.id)?.group.rootRow).to.equal(centre);
    expect(rowMeta.get(track.id)?.inherited).to.equal(true);
    expect(rowMeta.get(centre.id)?.inherited).to.equal(false);
  });

  it("matches only devops.gov.bc.ca and its subdomains as platform hosts", () => {
    expect(isPlatformManagedHost("eao-dev.apps.gold.devops.gov.bc.ca")).to.equal(true);
    expect(isPlatformManagedHost("devops.gov.bc.ca.example.com")).to.equal(false);
    expect(isPlatformManagedHost("notdevops.gov.bc.ca")).to.equal(false);
  });
});

describe("app sorting", () => {
  const sortedNames = (urls: ApplicationUrl[], sortBy: "expiry" | "name", sortOrder: "asc" | "desc" = "asc") =>
    groupAndSortApps(urls, buildCertificateIndex(urls).rowMeta, sortBy, sortOrder).map((app) => app.appName);

  it("puts a certificate error ahead of one that is only expiring", () => {
    const urls = [
      row("Expiring App", "PROD", "https://expiring.example.com", {
        ssl_status: "Expiring Soon",
        ssl_expiry: dayjs().add(10, "day").toISOString(),
      }),
      row("Broken App", "PROD", "https://broken.example.com", { ssl_status: "Error" }),
      // The platform renews this one, so it doesn't make the app urgent
      row("Platform App", "DEV", `${PLATFORM_HOST}/platform`, { ssl_status: "Expired" }),
    ];

    expect(sortedNames(urls, "expiry")).to.deep.equal(["Broken App", "Expiring App", "Platform App"]);
  });

  it("orders apps with no certificate data by name, whatever order they arrive in", () => {
    const urls = [
      row("Charlie", "PROD", "https://c.example.com"),
      row("Alpha", "PROD", "https://a.example.com"),
      row("Bravo", "PROD", "https://b.example.com"),
    ];

    expect(sortedNames(urls, "expiry")).to.deep.equal(["Alpha", "Bravo", "Charlie"]);
    expect(sortedNames(urls, "name", "desc")).to.deep.equal(["Charlie", "Bravo", "Alpha"]);
  });

  it("lists environments PROD, TEST, DEV, then the rest by name", () => {
    const urls = ["UAT", "DEV", "DEMO", "PROD", "TEST"].map((environment) =>
      row("App", environment, `https://${environment.toLowerCase()}.example.com`),
    );

    const [app] = groupAndSortApps(urls, buildCertificateIndex(urls).rowMeta, "name", "asc");

    expect(app.appUrls.map((url) => url.environment)).to.deep.equal(["PROD", "TEST", "DEV", "DEMO", "UAT"]);
  });

  it("groups an app whose name is an object property", () => {
    const urls = [row("constructor", "PROD", "https://constructor.example.com")];

    expect(sortedNames(urls, "name")).to.deep.equal(["constructor"]);
  });
});

describe("expiry", () => {
  it("calls a certificate that expired hours ago expired, not due today", () => {
    const info = getExpiryInfo(dayjs().subtract(20, "hour").toISOString());

    expect(info?.expired).to.equal(true);
    expect(info?.text).to.equal("Expired");
  });

  it("counts calendar days and rounds months", () => {
    expect(getExpiryInfo(dayjs().add(1, "day").toISOString())?.text).to.equal("In 1 day");
    expect(getExpiryInfo(dayjs().add(45, "day").toISOString())?.text).to.equal("In ~2 months");
  });

  it("reads the API's UTC timestamps as UTC", () => {
    expect(getExpiryInfo("2030-01-01T00:00:00+00:00")?.expiry.valueOf()).to.equal(Date.UTC(2030, 0, 1));
  });
});
