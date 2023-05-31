/** @type {import('tailwindcss').Config} */

const colors = require("tailwindcss/colors");

module.exports = {
    content: ["./src/**/*.{html,js,tsx}"],
    theme: {
        extend: {},
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                colors: {
                    primary: "#fc1d3d",
                },
            },
        ],
    },
};
