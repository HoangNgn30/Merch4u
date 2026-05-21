import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;
export const API_URL = apiUrl;

const getFullUrl = (url) => {
    if (!apiUrl) return url;
    const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const path = url.startsWith('/') ? url : '/' + url;
    return `${base}${path}`;
};

export const postData = async (url, formData) => {
    try {
        
        const response = await fetch(getFullUrl(url), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Include your API key in the Authorization header
                'Content-Type': 'application/json', // Adjust the content type as needed
            },

            body: JSON.stringify(formData)
        });


        if (response.ok) {
            const data = await response.json();
            //console.log(data)
            return data;
        } else {
            const errorData = await response.json();
            return errorData;
        }

    } catch (error) {
        console.error('Error:', error);
    }

}



export const fetchDataFromApi = async (url) => {
    try {
        const params={
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Include your API key in the Authorization header
                'Content-Type': 'application/json', // Adjust the content type as needed
              },
        
        } 

        const { data } = await axios.get(getFullUrl(url),params)
        return data;
    } catch (error) {
        console.log(error);
        return error;
    }
}


export const uploadImage = async (url, updatedData ) => {
    const params={
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Include your API key in the Authorization header
            'Content-Type': 'multipart/form-data', // Adjust the content type as needed
          },
    
    } 

    var response;
    await axios.put(getFullUrl(url),updatedData, params).then((res)=>{
        response=res;
        
    })
    return response;
   
}




export const editData = async (url, updatedData ) => {
    const params={
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Include your API key in the Authorization header
            'Content-Type': 'application/json', // Adjust the content type as needed
          },
    
    } 

    var response;
    await axios.put(getFullUrl(url),updatedData, params).then((res)=>{
        response=res;
        
    }).catch((error) => {
        response = error?.response;
    })
    return response;
   
}


export const deleteData = async (url ) => {
    const params={
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Include your API key in the Authorization header
            'Content-Type': 'application/json', // Adjust the content type as needed
          },
    
    } 
    const { data } = await axios.delete(getFullUrl(url),params)
    return data;
}
