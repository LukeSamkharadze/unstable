import { createColorSet, withAccountKitUi } from "@account-kit/react/tailwind";
import type { Config } from "tailwindcss";

export default withAccountKitUi(
	{
		content: [
			"./pages/**/*.{js,ts,jsx,tsx,mdx}",
			"./components/**/*.{js,ts,jsx,tsx,mdx}",
			"./app/**/*.{js,ts,jsx,tsx,mdx}",
		],
		theme: {
			extend: {
				colors: {
					background: "var(--background)",
					foreground: "var(--foreground)",
				},
			},
		},
		plugins: [],
	} satisfies Config,
	{
		colors: {
			"btn-primary": createColorSet("#E82594", "#FF66CC"),
			"fg-accent-brand": createColorSet("#E82594", "#FF66CC"),
		},
	},
);
