export const fetchHello = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/hello");
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return { message: "Error connecting to server" };
    }
};