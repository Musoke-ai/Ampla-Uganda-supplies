import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectHistory, useGetHistoryQuery } from '../api/historySlice';
import { selectStock } from '../stock/stockSlice';
import format from 'date-fns/format';
import ProductExcerpty from '../../Components/excerpts/ProductExcerpty';
import SearchIcon  from "@mui/icons-material/Search";
import Fuse from 'fuse.js';

const History = () => {
    const {
        isLoading: ishistoryLoading,
        isSuccess: ishistorySuccess,
        isError: ishistoryError,
        error: historyError
      } = useGetHistoryQuery();

      const products = useSelector(selectStock);
      const history = useSelector(selectHistory);

      const newHistory = history.map((_history) => {
        return {
          ..._history,
          item: products.map((product) => {
            if(Number(product.itemId) === Number(_history.historyItemId)){
              return product.itemName;
            }
          })
        }
      })

      const [searchTerm, setSearchTerm] = useState("");
      const [_history, setHistory] = useState(null);

      const FormatDate = ({date}) => {
        if(date){
          const _date = new Date(date);
          const fDate = format(_date,'MMM-dd-yyyy');
          return fDate;
        }else{
          return "";
        }
      }

      const options = {
        includeScore: true,
        includeMatches: true,
        threshold: 0.2,
        keys: ["item","historyDetails","historyAction"],
      }
        
     const fuse = new Fuse(newHistory, options);

     useEffect(() => {
        if(searchTerm.length > 0){
            const results = fuse.search(searchTerm);
            const items = results.map((result) => result.item);
            
            if(items.length > 0){
              
            setHistory(items);
         
            }
        }
        else{
          setHistory(newHistory)
        }
     },[searchTerm])   

      const handleSearch = (e) => {
         setSearchTerm(e.target.value);
      };
  return (
    <div className='container'>
      <div className="custOperations bg-white w-100 p-4 mt-2 d-flex align-items-center mb-3" style={{height: '60px'}}>
        
        <div className="form-group has-search w-50 rounded border-0">
          <span className="fa fa-search border-0 form-control-feedback"><SearchIcon /></span>
          <input type="text" className="form-control form-control-input border" placeholder="Search history"   onChange={handleSearch} />
        </div>

    </div> 
  
<div className="graphs container mt-1">
          <div className="d-flex justify-content-between align-items-center p-2 pt-3 rounded text-white" style={{backgroundColor: '#488A99'}}>
  <div><h5 class="">Your History</h5></div>
  <div>
  </div>
  </div>
  {/* <hr /> */}
  {
   ishistoryLoading?
    <div class="d-flex flex-row justify-content-center align-content-center">
      <h5>Loading history...</h5>
    </div>
    :""
  }
  {ishistorySuccess?
   <div className="mb-5">
   <table class="table table-striped">
   <thead>
     <tr>
       <th scope="col">Date</th>
       <th scope="col">Item</th>
       <th scope="col">Action</th>
       <th scope="col">More details</th>
     </tr>
   </thead>
   <tbody>
    {
        _history !== null?
        <>
          {
    
    _history.map((history, index) => {
   return(  <tr key={index}>
     <td>{<FormatDate date={history?.historyDateCreated} />}</td>
     <td>{<ProductExcerpty itemId={history?.historyItemId} field="itemName" />}</td>
     <td>{history?.historyAction}</td>
     <td>{history?.historyDetails}</td>
   </tr>)
   })}
        </>
        :<p className='text-warning w-100 text-center'>No history yet</p>
    }
    <>

  </>
   </tbody>
 </table>
 </div>
  :""}
  {ishistoryError? 
  <div class="d-flex flex-row justify-content-center align-content-center">
    <h5>An expected error occured while loading your content!</h5>
  </div>
  :""}
        </div>
    </div>
  );
}

export default History;
