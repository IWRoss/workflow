import Chart from "react-apexcharts";

const BarChart = ({ series, categories = [], title, unit = "", maxValue }) => {
    const options = {
        chart: {
            type: "bar",
            width: "100%",
            stacked: true, 
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,     
                barHeight: '50%', 
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return unit + val.toFixed(0);
            },
        },
        xaxis: {
            categories: categories,
            max: maxValue,  
            labels: {
                formatter: function (val) {
                    return unit + val.toLocaleString();
                }
            }
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return unit + value.toFixed(2);
                },
            },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left'
        }
    };

    return (
        <div className="w-full mx-auto overflow-hidden">
            <Chart 
                options={options} 
                series={series} 
                type="bar" 
                width="100%"
                height={200}  
            />
        </div>
    );
};

export default BarChart;