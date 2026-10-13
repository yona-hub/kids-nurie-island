import { defineConfig, mergeConfig } from "vitest/config";
import base from "../vitest.config";

// Deliberately disable one audit fix in Vitest's in-memory transform. This
// proves that the race assertions detect the pre-fix behaviour without ever
// modifying the app files or the running development server.
const mutation = process.env.UI_AUDIT_MUTATION;
if (!["A03-01", "A03-02", "A03-03", "A03-04"].includes(mutation ?? "")) {
  throw new Error("Set UI_AUDIT_MUTATION to A03-01, A03-02, A03-03 or A03-04.");
}
const config = mergeConfig(
  base,
  defineConfig({
    plugins: [
      {
        name: "audit-race-regression-proof",
        enforce: "pre",
        transform(source, id) {
          const path = id.replaceAll("\\", "/");
          if (
            mutation === "A03-01" &&
            path.endsWith("/apps/web/src/pages/Editor.tsx")
          ) {
            return source
              .replace(
                /if \(!scope\.isActive\(\)\) throw new Error\([^\n]*\);/,
                "",
              )
              .replaceAll(
                "if (!scope.isActive() || controller.signal.aborted) return;",
                "",
              );
          }
          if (mutation === "A03-02") {
            if (path.endsWith("/apps/web/src/App.tsx"))
              return source.replace("key={session.userId}", "");
            if (path.endsWith("/apps/web/src/pages/Gallery.tsx"))
              return source.replace(
                "[projectId, projects, ownerId, captureScope]",
                "[projectId]",
              );
          }
          if (
            mutation === "A03-03" &&
            path.endsWith("/apps/web/src/pages/Settings.tsx")
          ) {
            return source.replace("await reloadSettings();", "");
          }
          if (
            mutation === "A03-04" &&
            path.endsWith("/apps/web/src/app-context.tsx")
          ) {
            return source.replace("write === settingsWrite.current &&", "");
          }
        },
      },
    ],
    test: { include: ["tests/ui-async-races.test.tsx"] },
  }),
);
// mergeConfig concatenates arrays; keep the mutation run limited to this suite.
config.test = { ...config.test, include: ["tests/ui-async-races.test.tsx"] };
export default config;
