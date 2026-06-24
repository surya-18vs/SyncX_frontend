import axios from "axios";

const API = axios.create({

  baseURL:
    "https://syncx-backend-a5pj.onrender.com/api",

});

export default API;