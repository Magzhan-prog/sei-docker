import { useState, useEffect } from "react";
import axios from "axios";

const useFetchData = (url, dependencies) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      if (!url) return;
      setLoading(true);
      axios
        .get(url)
        .then((response) => setData(response.data))
        .catch((error) => console.error("Error fetching data:", error))
        .finally(() => setLoading(false));
    }, dependencies);
  
    return { data, loading };
  };

  export default useFetchData;