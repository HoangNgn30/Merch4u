import React, { useState } from 'react'
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useContext } from 'react';
import { MyContext } from '../../App';
import UploadBox from '../../Components/UploadBox';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { FaCloudUploadAlt } from "react-icons/fa";
import { Button } from '@mui/material';
import { IoMdClose } from "react-icons/io";
import { deleteImages, editData, fetchDataFromApi, postData } from '../../utils/api';
import { useEffect } from 'react';

export const EditRightBanner = () => {

    const [formFields, setFormFields] = useState({
        images: []
    });

    const [previews, setPreviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const history = useNavigate();


    const context = useContext(MyContext);


    useEffect(() => {
        const id = context?.isOpenFullScreenPanel?.id;

        fetchDataFromApi(`/api/rightBanner/${id}`).then((res) => {
            console.log(res)
            setPreviews(res?.banner?.images)
            formFields.images = res?.banner?.images
        })

    }, []);    const setPreviewsFun = (previewsArr) => {
        setPreviews(previewsArr)
        formFields.images = previewsArr
    }


    const removeImg = (image, index) => {
        var imageArr = [];
        imageArr = previews;
        deleteImages(`/api/category/deteleImage?img=${image}`).then((res) => {
            imageArr.splice(index, 1);

            setPreviews([]);
            setTimeout(() => {
                setPreviews(imageArr);
                formFields.images = imageArr
            }, 100);

        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        setIsLoading(true);

        console.log(formFields)


        if (previews?.length === 0) {
            context.alertBox("error", "Please select category image");
            setIsLoading(false);
            return false
        }


        editData(`/api/rightBanner/${context?.isOpenFullScreenPanel?.id}`, formFields).then((res) => {

            setTimeout(() => {
                setIsLoading(false);
                context.setIsOpenFullScreenPanel({
                    open: false,
                })
                context?.getCat();
                history("/rightBanner/list")
            }, 2500);
        })


    }


    return (
        <section className='p-5 bg-gray-50'>
            <form className='form py-1 p-1 md:p-8 md:py-1' onSubmit={handleSubmit}>
                <div className='scroll max-h-[72vh] overflow-y-scroll pr-4 pt-4'>

                    <br />

                    <h3 className='text-[18px] font-[500] mb-0 text-black'> Image</h3>
                    <br />
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                        {
                            previews?.length !== 0 && previews?.map((image, index) => {
                                return (
                                    <div className="uploadBoxWrapper mr-3 relative" key={index}>

                                        <span className='absolute w-[20px] h-[20px] rounded-full  overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer' onClick={() => removeImg(image, index)}><IoMdClose className='text-white text-[17px]' /></span>


                                        <div className='uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-[100%] bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative'>

                                            <img src={image} className='w-100' />
                                        </div>
                                    </div>
                                )
                            })
                        }


                        <UploadBox multiple={false} name="images" url="/api/rightBanner/uploadImages" setPreviewsFun={setPreviewsFun} />
                    </div>
                </div>


                <br />
                <div className='w-[250px]'>
                    <Button type="submit" className="btn-blue btn-lg w-full flex gap-2">
                        {
                            isLoading === true ? <CircularProgress color="inherit" />
                                :
                                <>
                                    <FaCloudUploadAlt className='text-[25px] text-white' />
                                    Publish and View
                                </>
                        }
                    </Button>
                </div>
            </form>
        </section>
    )
}
