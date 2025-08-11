import { ThreeDots } from 'react-bootstrap-icons';
import { Dropdown } from 'react-bootstrap';

const GraphFrame = ({
    title,
    graph
}) => {

return (
    <>
    <div className="bg-white rounded mt-3 mb-3 d-flex flex-column" style={{width:'400px', height:'230px'}}>
<div className='d-flex align-items-center justify-content-between ps-2 pe-2'>
   <div className='text-muted fs-bold ps-4' style={{fontSize:'1rem'}} >{title}</div>
   <div>
   <Dropdown>
      <Dropdown.Toggle variant="transparent" id="dropdown-basic" className='border-none'>
       <ThreeDots />
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item href="#/action-1">Action</Dropdown.Item>
        <Dropdown.Item href="#/action-2">Another action</Dropdown.Item>
        <Dropdown.Item href="#/action-3">Something else</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
   </div>
</div>
<div className='bg-light shadow-md' style={{width:'100%', height:'1.5px'}}></div>

<div className='graphArea'>
    {graph}
</div>
    </div>
    </>
)

}
export default GraphFrame;