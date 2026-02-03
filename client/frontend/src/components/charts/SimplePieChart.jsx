import Chart from "react-apexcharts";

const SimplePieChart = ({ series, labels = [], title, unit = "" }) => {
    const options = {
        chart: {
            type: "pie",
            width: "100%",
        },
        labels: labels,
        legend: {
            show: false,
            position: "bottom",
            horizontalAlign: "left",
        },
        dataLabels: {
            enabled: true,
            formatter: function (val, opts) {
                const value = opts.w.config.series[opts.seriesIndex];
                return value.toFixed(2) + (unit || "");
            },
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return value.toFixed(2) + (unit || "");
                },
            },
        },
        
    };

    return (
        <div className="w-full mx-auto overflow-hidden">
            
            <Chart 
                options={options} 
                series={series} 
                type="pie" 
                width="100%"
            />
        </div>
    );
};

export default SimplePieChart;