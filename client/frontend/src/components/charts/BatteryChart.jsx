import Chart from 'react-apexcharts';

const BatteryChart = ({ value, label }) => {
    const options = {
        chart: {
            type: 'radialBar',
        },
        plotOptions: {
            radialBar: {
                hollow: {
                    size: '70%',
                },
                dataLabels: {
                    name: {
                        fontSize: '16px',
                        color: '#666',
                    },
                    value: {
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#111',
                        formatter: (val) => `${val}%`,
                    },
                },
            },
        },
        colors: ['#00E396'],
        labels: [label],
    };

    const series = [value];

    return (
        <Chart 
            options={options} 
            series={series} 
            type="radialBar" 
            height={250}
        />
    );
};

export default BatteryChart;