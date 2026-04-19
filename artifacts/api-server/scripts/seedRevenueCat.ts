// One-shot seed script that provisions AmyNest's RevenueCat project.
// Usage: pnpm --filter @workspace/api-server exec tsx scripts/seedRevenueCat.ts
import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
} from "@replit/revenuecat-sdk";
import { getUncachableRevenueCatClient } from "../src/lib/revenueCatClient.js";

const PROJECT_NAME = "AmyNest AI";
const APP_STORE_APP_NAME = "AmyNest AI iOS";
const APP_STORE_BUNDLE_ID = "com.amynest.ai";
const PLAY_STORE_APP_NAME = "AmyNest AI Android";
const PLAY_STORE_PACKAGE_NAME = "com.amynest.ai";

const ENTITLEMENT_IDENTIFIER = "premium";
const ENTITLEMENT_DISPLAY_NAME = "AmyNest Premium";
const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";

type PlanSpec = {
  packageId: string;          // RC-reserved package identifier
  packageName: string;
  productId: string;          // store identifier (App Store + test store)
  playStoreId: string;        // play store needs {sub}:{base}
  displayName: string;
  duration: "P1M" | "P6M" | "P1Y";
  priceMicros: number;        // INR micros
};

const PLANS: PlanSpec[] = [
  { packageId: "$rc_monthly",   packageName: "Monthly",   productId: "amynest_monthly",  playStoreId: "amynest_monthly:monthly",     displayName: "AmyNest Monthly",   duration: "P1M", priceMicros: 199_000_000 },
  { packageId: "$rc_six_month", packageName: "6 Months",  productId: "amynest_6month",   playStoreId: "amynest_6month:six-month",    displayName: "AmyNest 6-Month",   duration: "P6M", priceMicros: 999_000_000 },
  { packageId: "$rc_annual",    packageName: "Yearly",    productId: "amynest_yearly",   playStoreId: "amynest_yearly:yearly",       displayName: "AmyNest Yearly",    duration: "P1Y", priceMicros: 1_599_000_000 },
];

async function seed() {
  const client = await getUncachableRevenueCatClient();

  // ── Project ──
  let project: Project;
  const { data: projects, error: lpErr } = await listProjects({ client, query: { limit: 50 } });
  if (lpErr) throw new Error("listProjects failed");
  const existingProject = projects.items?.find((p) => p.name === PROJECT_NAME);
  if (existingProject) {
    project = existingProject;
    console.log("✓ Project exists:", project.id);
  } else {
    const { data, error } = await createProject({ client, body: { name: PROJECT_NAME } });
    if (error) throw new Error("createProject failed");
    project = data;
    console.log("✓ Created project:", project.id);
  }

  // ── Apps (test store auto-created; create app store + play store) ──
  const { data: apps, error: laErr } = await listApps({ client, path: { project_id: project.id }, query: { limit: 20 } });
  if (laErr || !apps) throw new Error("listApps failed");
  let testApp = apps.items.find((a) => a.type === "test_store");
  let appStoreApp = apps.items.find((a) => a.type === "app_store");
  let playStoreApp = apps.items.find((a) => a.type === "play_store");
  if (!testApp) throw new Error("test_store app missing");
  console.log("✓ Test store app:", testApp.id);

  if (!appStoreApp) {
    const { data, error } = await createApp({
      client, path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("createApp(app_store) failed");
    appStoreApp = data;
    console.log("✓ Created App Store app:", appStoreApp.id);
  } else console.log("✓ App Store app:", appStoreApp.id);

  if (!playStoreApp) {
    const { data, error } = await createApp({
      client, path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("createApp(play_store) failed");
    playStoreApp = data;
    console.log("✓ Created Play Store app:", playStoreApp.id);
  } else console.log("✓ Play Store app:", playStoreApp.id);

  // ── Products (one per plan per app) ──
  const { data: existingProducts, error: lprErr } = await listProducts({ client, path: { project_id: project.id }, query: { limit: 200 } });
  if (lprErr) throw new Error("listProducts failed");

  const ensureProduct = async (targetApp: App, label: string, storeId: string, plan: PlanSpec, isTestStore: boolean): Promise<Product> => {
    const found = existingProducts.items?.find((p) => p.store_identifier === storeId && p.app_id === targetApp.id);
    if (found) {
      console.log(`  · ${label} product exists for ${plan.packageName}:`, found.id);
      return found;
    }
    const body: any = {
      store_identifier: storeId,
      app_id: targetApp.id,
      type: "subscription",
      display_name: plan.displayName,
    };
    if (isTestStore) {
      body.subscription = { duration: plan.duration };
      body.title = plan.displayName;
    }
    const { data, error } = await createProduct({ client, path: { project_id: project.id }, body });
    if (error) throw new Error(`createProduct(${label}/${plan.packageName}) failed: ${JSON.stringify(error)}`);
    console.log(`  + Created ${label} product for ${plan.packageName}:`, data.id);
    return data;
  };

  type PlanProducts = { plan: PlanSpec; testProd: Product; appProd: Product; playProd: Product };
  const planProducts: PlanProducts[] = [];
  for (const plan of PLANS) {
    console.log(`Plan: ${plan.packageName}`);
    const testProd = await ensureProduct(testApp, "Test", plan.productId, plan, true);
    const appProd = await ensureProduct(appStoreApp, "App Store", plan.productId, plan, false);
    const playProd = await ensureProduct(playStoreApp, "Play Store", plan.playStoreId, plan, false);
    // Add INR test-store price
    const { error: priceError } = await client.post({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProd.id },
      body: { prices: [{ amount_micros: plan.priceMicros, currency: "INR" }] },
    });
    if (priceError && (priceError as any).type !== "resource_already_exists") {
      console.log(`  ! price set warning for ${plan.packageName}:`, JSON.stringify(priceError));
    } else {
      console.log(`  · ${plan.packageName} test-store price set`);
    }
    planProducts.push({ plan, testProd, appProd, playProd });
  }

  // ── Entitlement ──
  let entitlement: Entitlement;
  const { data: ents, error: leErr } = await listEntitlements({ client, path: { project_id: project.id }, query: { limit: 20 } });
  if (leErr) throw new Error("listEntitlements failed");
  const existingEnt = ents.items?.find((e) => e.lookup_key === ENTITLEMENT_IDENTIFIER);
  if (existingEnt) { entitlement = existingEnt; console.log("✓ Entitlement exists:", entitlement.id); }
  else {
    const { data, error } = await createEntitlement({
      client, path: { project_id: project.id },
      body: { lookup_key: ENTITLEMENT_IDENTIFIER, display_name: ENTITLEMENT_DISPLAY_NAME },
    });
    if (error) throw new Error("createEntitlement failed");
    entitlement = data;
    console.log("✓ Created entitlement:", entitlement.id);
  }

  const allProductIds = planProducts.flatMap((pp) => [pp.testProd.id, pp.appProd.id, pp.playProd.id]);
  const { error: aeErr } = await attachProductsToEntitlement({
    client, path: { project_id: project.id, entitlement_id: entitlement.id },
    body: { product_ids: allProductIds },
  });
  if (aeErr && (aeErr as any).type !== "unprocessable_entity_error") {
    throw new Error("attachProductsToEntitlement failed");
  }
  console.log("✓ Products attached to entitlement");

  // ── Offering ──
  let offering: Offering;
  const { data: offerings, error: loErr } = await listOfferings({ client, path: { project_id: project.id }, query: { limit: 20 } });
  if (loErr) throw new Error("listOfferings failed");
  const existingOffering = offerings.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (existingOffering) { offering = existingOffering; console.log("✓ Offering exists:", offering.id); }
  else {
    const { data, error } = await createOffering({
      client, path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (error) throw new Error("createOffering failed");
    offering = data;
    console.log("✓ Created offering:", offering.id);
  }
  if (!offering.is_current) {
    const { error } = await updateOffering({ client, path: { project_id: project.id, offering_id: offering.id }, body: { is_current: true } });
    if (error) throw new Error("updateOffering failed");
    console.log("✓ Set offering as current");
  }

  // ── Packages (one per plan) ──
  const { data: existingPackages, error: lPkgErr } = await listPackages({ client, path: { project_id: project.id, offering_id: offering.id }, query: { limit: 20 } });
  if (lPkgErr) throw new Error("listPackages failed");

  for (const pp of planProducts) {
    let pkg: Package;
    const found = existingPackages.items?.find((p) => p.lookup_key === pp.plan.packageId);
    if (found) { pkg = found; console.log(`  · Package exists ${pp.plan.packageId}:`, pkg.id); }
    else {
      const { data, error } = await createPackages({
        client, path: { project_id: project.id, offering_id: offering.id },
        body: { lookup_key: pp.plan.packageId, display_name: pp.plan.packageName },
      });
      if (error) throw new Error(`createPackages(${pp.plan.packageId}) failed`);
      pkg = data;
      console.log(`  + Created package ${pp.plan.packageId}:`, pkg.id);
    }
    const { error: apErr } = await attachProductsToPackage({
      client, path: { project_id: project.id, package_id: pkg.id },
      body: { products: [
        { product_id: pp.testProd.id, eligibility_criteria: "all" },
        { product_id: pp.appProd.id, eligibility_criteria: "all" },
        { product_id: pp.playProd.id, eligibility_criteria: "all" },
      ] },
    });
    if (apErr && !((apErr as any).type === "unprocessable_entity_error" && (apErr as any).message?.includes("Cannot attach product"))) {
      throw new Error(`attachProductsToPackage(${pp.plan.packageId}) failed`);
    }
  }
  console.log("✓ All packages attached");

  // ── Public API keys ──
  const fetchKeys = async (appId: string) => {
    const { data, error } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: appId } });
    if (error) return "ERR";
    return data?.items.map((i) => i.key).join(", ") ?? "N/A";
  };
  const testKeys = await fetchKeys(testApp.id);
  const iosKeys = await fetchKeys(appStoreApp.id);
  const androidKeys = await fetchKeys(playStoreApp.id);

  console.log("\n========================================");
  console.log("RevenueCat seed complete!");
  console.log("========================================");
  console.log("REVENUECAT_PROJECT_ID=" + project.id);
  console.log("REVENUECAT_TEST_STORE_APP_ID=" + testApp.id);
  console.log("REVENUECAT_APPLE_APP_STORE_APP_ID=" + appStoreApp.id);
  console.log("REVENUECAT_GOOGLE_PLAY_STORE_APP_ID=" + playStoreApp.id);
  console.log("REVENUECAT_ENTITLEMENT_ID=" + ENTITLEMENT_IDENTIFIER);
  console.log("EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=" + testKeys);
  console.log("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=" + iosKeys);
  console.log("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=" + androidKeys);
  console.log("========================================\n");
}

seed().catch((e) => { console.error(e); process.exit(1); });
