// public/js/ui-orchestrator.js
import './router.js';
import './sidebar-left.js';
import './sidebar-right.js';
import './collections-page.js';
import './rag-chat.js';
import {fetchHello} from "./api-client.js";

const btn = document.getElementById("helloBtn");
const output = document.getElementById("output")

const handleHelloClick = async () => {
    output.innerText = "Loading...";
    const data = await fetchHello();
    output.innerText = data.message;
};

btn.addEventListener('click', handleHelloClick);

console.log("orchestrator initialised and modules linked.")