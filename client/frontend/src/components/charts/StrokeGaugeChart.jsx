import Chart from 'react-apexcharts';

const StrokeGaugeChart = ({ value, label }) => {
    const options = {
        chart: {
            height: 350,
            type: 'radialBar',
            offsetY: -10
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                dataLabels: {
                    name: {
                        fontSize: '16px',
                        color: undefined,
                        offsetY: 120
                    },
                    value: {
                        offsetY: 76,
                        fontSize: '22px',
                        color: undefined,
                        formatter: function (val) {
                            //2 decimal places
                            return val.toFixed(2) + "%";
                        }

                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                shadeIntensity: 0.15,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 50, 65, 91]
            },
        },
        stroke: {
            dashArray: 4
        },
        labels: [label] 
    };

    const series = [value]; 

    return (
        <div className="w-full max-w-md mx-auto">
            <Chart 
                options={options} 
                series={series} 
                type="radialBar" 
                height={350} 
            />
        </div>
    );
};

export default StrokeGaugeChart;