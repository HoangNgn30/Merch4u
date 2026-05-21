import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;

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
        console.error("API Error in fetchDataFromApi:", error);
        return {
            error: true,
            success: false,
            message: error?.response?.data?.message || error?.message || "Đã xảy ra lỗi kết nối",
            isAxiosError: true,
            response: error?.response
        };
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


export const uploadImages = async (url, formData ) => {
    const params={
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Include your API key in the Authorization header
            'Content-Type': 'multipart/form-data', // Adjust the content type as needed
          },
    
    } 

    var response;
    await axios.post(getFullUrl(url),formData, params).then((res)=>{
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





export const deleteImages = async (url) => {
    const params = {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
        },
    };
    const response = await axios.delete(getFullUrl(url), params);
    return response?.data;
}


export const deleteData = async (url ) => {
    const params={
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
    
    } 
    const { data } = await axios.delete(getFullUrl(url), params)
    return data;
}

export const deleteMultipleData = async (url, body) => {
    const config = {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
        },
        data: body
    }
    const { data } = await axios.delete(getFullUrl(url), config)
    return data;
}
