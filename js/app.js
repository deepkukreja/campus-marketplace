import { createHeader } from "./components/header.js";
import { renderHome } from "./pages/home.js";

const app = document.querySelector("#app");

const header = createHeader(".");

app.append(header);

const pageContent = document.createElement("div");

renderHome(pageContent);

app.append(pageContent);