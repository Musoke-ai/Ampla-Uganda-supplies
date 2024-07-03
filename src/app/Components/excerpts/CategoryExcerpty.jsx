import React from 'react';
import { useSelector } from 'react-redux';
import { selectCategoriesById } from '../../features/api/categorySlice';

const CategoryExcerpty = ({catId}) => {
    let output = ""
const category = useSelector((state) => selectCategoriesById(state, Number(catId)));
if(category != undefined){
    output = category.categoryName
    return output;
}

  return (
    <div>
    {output}
    </div>
  );
}

export default CategoryExcerpty;
