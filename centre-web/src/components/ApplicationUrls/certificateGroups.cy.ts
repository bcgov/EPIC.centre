import dayjs from "dayjs";
import { ApplicationUrl, SslCertificate } from "@/models/ApplicationUrl";
import {
  buildCertificateIndex,
  describeStaleness,
  getManagedCertificates,
  groupAndSortApps,
} from "./certificateGroups";
import { getExpiryInfo } from "./sslUtils";

let nextId = 1;
const url = (
  app_name: string,
  environment: string,
  address: string,
  certificate_id: number | null,
): ApplicationUrl => ({
  id: nextId++,
  app_name,
  environment,
  url: address,
  certificate_id,
  is_active: true,
});

const certificate = (id: number, host: string, fields: Partial<SslCertificate> = {}): SslCertificate => ({
  id,
  origin: `https://${host}:443`,
  host,
  port: 443,
  status: "Valid",
  expires_at: dayjs().add(200, "day").toISOString(),
  issuer: "Test CA",
  check_error: null,
  last_checked: dayjs().subtract(1, "hour").toISOString(),
  is_platform_managed: false,
  ticket_reference: null,
  renewal_status: "NONE",
  renewal_comments: null,
  ...fields,
});

const PLATFORM = certificate(1, "eao-dev.apps.gold.devops.gov.bc.ca", { is_platform_managed: true });
const SHARED = certificate(2, "system.eao.gov.bc.ca");
const SUBMIT = certificate(3, "submit.eao.gov.bc.ca");

describe("certificate groups", () => {
  it("groups URLs by the certificate the API linked them to", () => {
    const centre = url("EPIC Centre", "PROD", "https://system.eao.gov.bc.ca/", SHARED.id);
    const track = url("EPIC Track", "PROD", "https://system.eao.gov.bc.ca/track", SHARED.id);
    const plain = url("Old App", "PROD", "http://old.example.com", null);

    const { certificateGroups, rowMeta } = buildCertificateIndex([centre, track, plain], [SHARED]);

    expect(certificateGroups).to.have.length(1);
    expect(certificateGroups[0].rows).to.deep.equal([centre, track]);
    expect(rowMeta.get(plain.id)).to.deep.equal({ group: null, inherited: false });
  });

  it("leaves platform-renewed certificates out of the ones we manage", () => {
    const { certificateGroups } = buildCertificateIndex([
      url("EPIC Centre", "DEV", "https://eao-dev.apps.gold.devops.gov.bc.ca", PLATFORM.id),
      url("EPIC Submit", "PROD", "https://submit.eao.gov.bc.ca", SUBMIT.id),
    ], [PLATFORM, SUBMIT]);

    expect(getManagedCertificates(certificateGroups).map((group) => group.certificate.host)).to.deep.equal([
      "submit.eao.gov.bc.ca",
    ]);
  });

  it("lists the certificates we manage most urgent first", () => {
    const soon = certificate(4, "soon.example.com", {
      status: "Expiring Soon",
      expires_at: dayjs().add(10, "day").toISOString(),
    });
    const broken = certificate(5, "broken.example.com", { status: "Error", check_error: "Timed out connecting" });
    const { certificateGroups } = buildCertificateIndex([
      url("Soon", "PROD", "https://soon.example.com", soon.id),
      url("Fine", "PROD", "https://submit.eao.gov.bc.ca", SUBMIT.id),
      url("Broken", "PROD", "https://broken.example.com", broken.id),
    ], [soon, SUBMIT, broken]);

    expect(getManagedCertificates(certificateGroups).map((group) => group.certificate.host)).to.deep.equal([
      "broken.example.com",
      "soon.example.com",
      "submit.eao.gov.bc.ca",
    ]);
  });

  it("marks path routes as inheriting from the bare host", () => {
    const centre = url("EPIC Centre", "PROD", "https://system.eao.gov.bc.ca/", SHARED.id);
    const track = url("EPIC Track", "PROD", "https://system.eao.gov.bc.ca/track", SHARED.id);
    const { rowMeta } = buildCertificateIndex([track, centre], [SHARED]);

    expect(rowMeta.get(track.id)?.group?.rootRow).to.equal(centre);
    expect(rowMeta.get(track.id)?.inherited).to.equal(true);
    expect(rowMeta.get(centre.id)?.inherited).to.equal(false);
  });

  it("makes a path route the root when no bare-origin row exists", () => {
    const compliance = url("EPIC Compliance", "PROD", "https://system.eao.gov.bc.ca/compliance", SHARED.id);
    const track = url("EPIC Track", "PROD", "https://system.eao.gov.bc.ca/track", SHARED.id);
    const { rowMeta } = buildCertificateIndex([track, compliance], [SHARED]);

    expect(rowMeta.get(compliance.id)?.inherited).to.equal(false);
    expect(rowMeta.get(track.id)?.inherited).to.equal(true);
  });
});

describe("app sorting", () => {
  const sortedNames = (
    urls: ApplicationUrl[],
    certificates: SslCertificate[],
    sortBy: "expiry" | "name",
    sortOrder: "asc" | "desc" = "asc",
  ) =>
    groupAndSortApps(urls, buildCertificateIndex(urls, certificates).rowMeta, sortBy, sortOrder)
      .map((app) => app.appName);

  it("puts a certificate error ahead of one that is only expiring", () => {
    const soon = certificate(6, "expiring.example.com", {
      status: "Expiring Soon",
      expires_at: dayjs().add(10, "day").toISOString(),
    });
    const broken = certificate(7, "broken.example.com", { status: "Error" });
    const expiredPlatform = certificate(8, "x.apps.gold.devops.gov.bc.ca", {
      status: "Expired",
      is_platform_managed: true,
    });
    const urls = [
      url("Expiring App", "PROD", "https://expiring.example.com", soon.id),
      url("Broken App", "PROD", "https://broken.example.com", broken.id),
      // The platform renews this one, so it doesn't make the app urgent
      url("Platform App", "DEV", "https://x.apps.gold.devops.gov.bc.ca", expiredPlatform.id),
    ];

    expect(sortedNames(urls, [soon, broken, expiredPlatform], "expiry")).to.deep.equal([
      "Broken App",
      "Expiring App",
      "Platform App",
    ]);
  });

  it("orders apps with no certificate data by name, whatever order they arrive in", () => {
    const urls = [
      url("Charlie", "PROD", "http://c.example.com", null),
      url("Alpha", "PROD", "http://a.example.com", null),
      url("Bravo", "PROD", "http://b.example.com", null),
    ];

    expect(sortedNames(urls, [], "expiry")).to.deep.equal(["Alpha", "Bravo", "Charlie"]);
    expect(sortedNames(urls, [], "name", "desc")).to.deep.equal(["Charlie", "Bravo", "Alpha"]);
  });

  it("lists environments PROD, TEST, DEV, then the rest by name", () => {
    const urls = ["UAT", "DEV", "DEMO", "PROD", "TEST"].map((environment) =>
      url("App", environment, `http://${environment.toLowerCase()}.example.com`, null),
    );

    const [app] = groupAndSortApps(urls, buildCertificateIndex(urls, []).rowMeta, "name", "asc");

    expect(app.appUrls.map((row) => row.environment)).to.deep.equal(["PROD", "TEST", "DEV", "DEMO", "UAT"]);
  });

  it("groups an app whose name is an object property", () => {
    const urls = [url("constructor", "PROD", "http://constructor.example.com", null)];

    expect(sortedNames(urls, [], "name")).to.deep.equal(["constructor"]);
  });
});

describe("check freshness", () => {
  it("says nothing while checks are recent", () => {
    expect(describeStaleness([SHARED])).to.equal(null);
  });

  it("warns when the daily check seems to have stopped", () => {
    const stale = certificate(9, "stale.example.com", { last_checked: dayjs().subtract(3, "day").toISOString() });

    expect(describeStaleness([stale])).to.contain("last checked 3 days ago");
  });

  it("says when nothing has been checked yet", () => {
    const unchecked = certificate(10, "new.example.com", { status: "Unknown", last_checked: null });

    expect(describeStaleness([unchecked])).to.contain("haven't been checked yet");
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
