module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: "module",
	},
	env: {
		es6: true,
		browser: true,
	},
	// plugins: ["svelte3", "prettier"],
	// overrides: [
	//   {
	//     files: ["*.svelte"],
	//     processor: "svelte3/svelte3",
	//   },
	// ],
	extends: ["prettier"],
	// extends: ['eslint:recommended', 'plugin:dprint/recommended'],

	// extends: ["eslint:recommended", "plugin:node/recommended"],
	rules: {
		// "prettier/prettier": "error",
		// "vue/singleline-html-element-content-newline": 0,
		// "vue/max-attributes-per-line": 0,
		// "vue/attributes-order": 0,
		// "vue/mustache-interpolation-spacing": 0,
		"arrow-parens": 0,
		// allow async-await
		"generator-star-spacing": 0,
		semi: 0,
		"arrow-spacing": 0,
		// 'comma-dangle': 1,
		"eol-last": 0,
		"space-before-function-paren": 0,
		// allow debugger during development
		"no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
		quotes: [0, "single"],
		"no-mixed-requires": [0],
		"no-underscore-dangle": [0],
		"semi-spacing": [0],
		"no-console": [0],
		curly: [0],
		"new-cap": [0],
		"comma-dangle": [0],
		strict: 2,
	},
	globals: {},
};
