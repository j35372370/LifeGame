import type { Config } from "@docusaurus/types";

const config: Config = {
  title: "LIFE GAME WIKI",
  tagline: "아라공화국 세계관과 시스템 지식 저장소",
  favicon: "img/favicon.ico",
  url: "https://example.com",
  baseUrl: "/",
  organizationName: "life-game",
  projectName: "life-game",
  i18n: {
    defaultLocale: "ko",
    locales: ["ko"]
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/"
        },
        blog: false,
        theme: {
          customCss: undefined
        }
      }
    ]
  ]
};

export default config;
