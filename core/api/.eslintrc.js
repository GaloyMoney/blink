module.exports = {
    "plugins": [
        "eslint-plugin-import",
        "@typescript-eslint",
        "prettier",
        "jest"
    ],
    "extends": [
        "@galoy/eslint-config/base",
        "plugin:jest/recommended"
    ],
    "rules": {
        "jest/no-disabled-tests": "off"
    }
}
