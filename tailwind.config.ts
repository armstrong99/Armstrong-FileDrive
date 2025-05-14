module.exports = {
  //...
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light",
      "dark",
      {
        mytheme: {
          "btn-disabled-bg": "#93C5FD",
        },
      },
    ],
  },
};
