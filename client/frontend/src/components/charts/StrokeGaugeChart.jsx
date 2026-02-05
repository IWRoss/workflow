import Chart from 'react-apexcharts';

const StrokeGaugeChart = ({ value, label }) => {
    const options = {
        chart: {
            height: 350,
            type: 'radialBar',
            offsetY: -10
        },
        colors: ['#00845A'],
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                dataLabels: {
                    name: {
                        fontSize: '16px',
                        color: '#64748b',
                        offsetY: 80,
                        fontWeight: 'bold'
                    },
                    value: {
                        offsetY: 40,
                        fontSize: '22px',
                        color: '#64748b',
                        formatter: function (val) {
                            //2 decimal places
                            return val.toFixed(2) + "%";
                        }

                    }
                },
                
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
                stops: [0, 100],
                gradientToColors: ['#006b49'],
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