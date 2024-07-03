import React from 'react';
import { ResponsiveContainer,Pie, Cell, Tooltip, Legend, PieChart } from 'recharts';
import randomColor from 'randomcolor';

const PieChartComponent = ({data}) => {
  // const colorLen = data.length;

  // const COLORS = randomColor({
  //   count: colorLen,
  //   luminosity: 'bright',
  //   hue: 'random',
  //   format: 'rgba'
  // });

  const data1 = [
    { name: "Plumbing", value: 400 },
    { name: "Agricultural", value: 300 },
    { name: "Machinery", value: 300 },
    { name: "Safety", value: 4 },
    { name: "Spare and Accessories", value:100 },
    { name: "Paints", value: 50 },
    { name: "Construction", value: 700 },
    { name: "Heavy Machiney", value: 20 },
    { name: "Electrical", value: 500 },
    { name: "Casual", value: 412 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div>
    {/* <ResponsiveContainer width={600} aspect={5}> */}
<PieChart width='800px' height={300}>
      <Pie
        data={data1}
        cx={150}
        cy={150}
        labelLine={false}
        // label={renderCustomizedLabel}
        outerRadius={90}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
     <Tooltip/>
      <Legend layout='vertical' verticalAlign='top' align='right' />
      
     
    </PieChart>
    {/* </ResponsiveContainer> */}
    </div>
  );
}

export default PieChartComponent;
