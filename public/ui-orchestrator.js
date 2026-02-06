import { fetchHello} from "./api-client";

const btn = document.getElementById("helloBtn");
const output = document.getElementById("output")

// The "orchestration" logic
const handleHelloClick = async () => {
    output.innerText = "Loading...";
    const data = await fetchHello();
    output.innerText = data.message;
};

btn.addEventListener('click', handleHelloClick);

console.log("orchestrator initialised and modules linked.")