// js/common.js

// IMPORTANT: BASE_URL MUST be enabled
const BASE_URL = "/api/auth";

// Reusable POST request function
async function postData(url = "", data = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Request failed");
    }

    return await response.text();
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "API Error!",
      text: "Error: " + error.message,
    });
    throw error;
  }
}

// Reusable GET request function
async function getData(url = "") {
  try {
    const response = await fetch(`${BASE_URL}${url}`);
    if (!response.ok) throw new Error("Failed to fetch data");
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "API Error!",
      text: "Error fetching data: " + error.message,
    });
  }
}

// Reusable DELETE request function
async function deleteData(url = "") {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete data");
    return await response.text();
  } catch (error) {
    console.error("Error:", error);
    Swal.fire({
      icon: "error",
      title: "API Error!",
      text: "Error deleting data: " + error.message,
    });
  }
}
