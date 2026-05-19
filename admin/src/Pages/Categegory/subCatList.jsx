import React, { useContext, useState } from 'react';
import { Button } from "@mui/material";
import { MyContext } from '../../App';
import { FaAngleDown } from "react-icons/fa6";
import EditSubCatBox from './EditSubCatBox';

export const SubCategoryList = () => {

    const [isOpen, setIsOpen] = useState(0);
    const context = useContext(MyContext);

    const expend = (index) => {
        if (isOpen === index) {
            setIsOpen(!isOpen);
        } else {
            setIsOpen(index);
        }

    }

    return (
        <>
            <div className="card my-2 pt-5 pb-5 px-5 shadow-md sm:rounded-lg bg-white">
                <div className="flex items-center w-full pb-4 justify-between flex-wrap gap-3">
                    <div className="col">
                        <h2 className="text-[18px] font-[600]">
                            Danh sách danh mục con
                        </h2>
                    </div>

                    <div className="col ml-auto flex items-center justify-end gap-3">
                        <Button className="btn-blue !text-white btn-sm" onClick={() => context.setIsOpenFullScreenPanel({
                            open: true,
                            model: 'Add New Sub Category'
                        })}>Thêm danh mục con</Button>
                    </div>
                </div>

                {
                    context?.catData?.length !== 0 &&
                    <ul className='w-full'>
                        {
                            context?.catData?.map((firstLavelCat, index) => {
                                return (
                                    <li className='w-full mb-1' key={index}>
                                        <div className='flex items-center w-full p-2 bg-[#f1f1f1] rounded-sm px-4 h-12'>
                                            <span className='font-[500] flex items-center gap-4 text-[14px]'>
                                                {firstLavelCat?.name}
                                            </span>

                                            {
                                                firstLavelCat?.children?.length !== 0 &&
                                                <button className="min-w-[35px] w-[35px] h-[35px] rounded-full text-black ml-auto flex items-center justify-center hover:bg-[#e2e2e2] transition-all" onClick={() => expend(index)}>
                                                    <FaAngleDown />
                                                </button>
                                            }

                                        </div>

                                        {
                                            isOpen === index &&
                                            <>
                                                {firstLavelCat?.children?.length !== 0 &&
                                                    <ul className='w-full'>
                                                        {firstLavelCat?.children?.map((subCat, index_) => {
                                                            return (
                                                                <li className='w-full py-1' key={index_}>
                                                                    <EditSubCatBox
                                                                        name={subCat?.name}
                                                                        id={subCat?._id}
                                                                        catData={context?.catData}
                                                                        index={index_}
                                                                        selectedCat={subCat?.parentId}
                                                                        selectedCatName={subCat?.parentCatName}
                                                                    />

                                                                    {
                                                                        subCat?.children?.length !== 0 &&
                                                                        <ul className="pl-4">
                                                {
                                                    subCat?.children?.map((thirdLevel, index__) => {
                                                        return (
                                                            <li
                                                                key={index__}
                                                                className="w-full  hover:bg-[#f1f1f1]"
                                                            >
                                                                <EditSubCatBox
                                                                    name={thirdLevel.name}
                                                                    catData={firstLavelCat?.children}
                                                                    index={index__}
                                                                    selectedCat={thirdLevel?.parentId}
                                                                    selectedCatName={thirdLevel?.parentCatName}
                                                                    id={thirdLevel?._id} />
                                                            </li>
                                                        )
                                                    })
                                                }
                                                                        </ul>
                                                                    }

                                                                </li>
                                                            )
                                                        })
                                                        }
                                                    </ul>
                                                }
                                            </>
                                        }


                                    </li>
                                )
                            })
                        }
                    </ul>
                }
            </div>

        </>
    )
}

export default SubCategoryList;
