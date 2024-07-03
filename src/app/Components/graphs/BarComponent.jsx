import {CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,BarChart,Bar, Legend } from 'recharts';
const BarComponent = ({data , layout}) => {
  return <>
    {/* <ResponsiveContainer width="100%" aspect={5}> */}
    <BarChart width='500px' height={100} data={data}  layout={layout} barCategoryGap='20%' padding="10%">
      <CartesianGrid strokeDasharray="1 1" />
      <XAxis dataKey="itemName" interval={0}  padding={{ bottom: 'gap' }} tick={false} tickLine="false" angle='-45' tickSize={20} >
      </XAxis>
    
      <YAxis horizontal="" vertical="" />
      <Tooltip />
      <Legend align='top' />
      <Bar dataKey="itemQuantity" fill="#8884d8" barSize={20} />
    </BarChart>
    {/* </ResponsiveContainer> */}
    </>
  
}

export default BarComponent;