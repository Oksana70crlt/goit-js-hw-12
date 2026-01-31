import axios from 'axios';

const BASE_URL = 'https://pixabay.com/api/';
const API_KEY = '23862309-642a8b5e3128a5abba1046e7c';

export async function getImagesByQuery(query, page) {

  const params = {
    key: API_KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page,
    per_page: 15,
  };

  const response = await axios.get(BASE_URL, { params });
  return response.data;
} 

