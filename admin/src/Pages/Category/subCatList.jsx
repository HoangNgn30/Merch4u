import React, { useContext, useState } from 'react';
import { Button } from "@mui/material";
import { MyContext } from '../../App';
import { FaAngleDown, FaAngleUp } from "react-icons/fa6";
import EditSubCatBox from './EditSubCatBox';

export const SubCategoryList = () => {
    const [isOpen, setIsOpen] = useState(null);
    const context = useContext(MyContext);

    const expend = (index) => {
        if (isOpen === index) {
            setIsOpen(null);
        } else {
            setIsOpen(index);
        }
    };

    return (
        <div className="card my-4 p-6 shadow-xl border border-slate-100 rounded-2xl bg-white transition-all">
            <div className="flex items-center w-full pb-6 justify-between flex-wrap gap-3">
                <div className="col">
                    <h2 className="text-[18px] font-[600] text-slate-800">
                        Danh Sách Danh Mục Phụ
                    </h2>
                </div>
                <div className="col ml-auto">
                    <Button 
                        variant="contained"
                        size="small"
                        className="btn-blue !text-white !normal-case font-semibold rounded-xl px-4 py-2" 
                        onClick={() => context.setIsOpenFullScreenPanel({
                            open: true,
                            model: 'Add New Sub Category'
                        })}
                    >
                        Thêm Danh Mục Phụ
                    </Button>
                </div>
            </div>

            {context?.catData?.length !== 0 ? (
                <ul className="w-full flex flex-col gap-3">
                    {context?.catData?.map((firstLavelCat, index) => {
                        const hasChildren = firstLavelCat?.children?.length !== 0;
                        const isExpanded = isOpen === index;
                        return (
                            <li className="w-full border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300" key={firstLavelCat?._id || index}>
                                <div className={`flex items-center w-full p-4 h-14 px-6 transition-colors ${isExpanded ? 'bg-indigo-50/20' : 'bg-slate-50/50'}`}>
                                    <span className="font-semibold text-slate-800 text-[14px] flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span>
                                        {firstLavelCat?.name}
                                    </span>

                                    {hasChildren ? (
                                        <button 
                                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 ml-auto flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 hover:border-slate-300 transition-all shadow-sm focus:outline-none" 
                                            onClick={() => expend(index)}
                                        >
                                            {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-300 italic ml-auto font-medium">Trống</span>
                                    )}
                                </div>

                                {isExpanded && hasChildren && (
                                    <div className="bg-white border-t border-slate-100 p-4 pl-8">
                                        <ul className="w-full flex flex-col gap-2 relative before:absolute before:left-2 before:top-2 before:bottom-6 before:w-0.5 before:bg-slate-100">
                                            {firstLavelCat?.children?.map((subCat, index_) => {
                                                const hasThirdChildren = subCat?.children?.length !== 0;
                                                return (
                                                    <li className="w-full py-1 relative pl-6 before:absolute before:left-2 before:top-5 before:w-4 before:h-0.5 before:bg-slate-100" key={subCat?._id || index_}>
                                                        <div className="bg-slate-50/40 rounded-xl border border-slate-100/80 hover:border-indigo-100 transition-colors shadow-sm">
                                                            <EditSubCatBox
                                                                name={subCat?.name}
                                                                id={subCat?._id}
                                                                catData={context?.catData}
                                                                index={index_}
                                                                selectedCat={subCat?.parentId}
                                                                selectedCatName={subCat?.parentCatName}
                                                            />
                                                        </div>

                                                        {hasThirdChildren && (
                                                            <ul className="pl-8 pt-2 flex flex-col gap-2 relative before:absolute before:left-3 before:top-2 before:bottom-6 before:w-0.5 before:bg-slate-100">
                                                                {subCat?.children?.map((thirdLevel, index__) => {
                                                                    return (
                                                                        <li
                                                                            key={thirdLevel?._id || index__}
                                                                            className="w-full relative pl-6 before:absolute before:left-3 before:top-5 before:w-3 before:h-0.5 before:bg-slate-100"
                                                                        >
                                                                            <div className="bg-white rounded-xl border border-slate-100 hover:border-violet-100 transition-colors shadow-inner">
                                                                                <EditSubCatBox
                                                                                    name={thirdLevel.name}
                                                                                    catData={firstLavelCat?.children}
                                                                                    index={index__}
                                                                                    selectedCat={thirdLevel?.parentId}
                                                                                    selectedCatName={thirdLevel?.parentCatName}
                                                                                    id={thirdLevel?._id} 
                                                                                />
                                                                            </div>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="px-5 py-12 text-center text-slate-400 font-medium italic">
                    Chưa có danh mục nào được tạo.
                </div>
            )}
        </div>
    );
};

export default SubCategoryList;
