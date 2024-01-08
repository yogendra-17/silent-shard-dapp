import "./index.css";
import "animate.css";
import "react-lazy-load-image-component/src/effects/blur.css";

import mixpanel from "mixpanel-browser";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import reportWebVitals from "./reportWebVitals";

const MIX_PANEL_TOKEN = process.env.REACT_APP_MIX_PANEL_TOKEN!;
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

mixpanel.init(MIX_PANEL_TOKEN, {
  autotrack: true,
  track_pageview: true,
  loaded: function () {
    mixpanel.track("Mixpanel Loaded on dApp");
  },
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
