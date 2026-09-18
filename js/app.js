import { createHeader } from "./components/header.js";

const app = document.querySelector("#app");

const header = createHeader();

app.append(header);