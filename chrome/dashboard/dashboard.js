const baseUrl = "https://us-central1-ctkr-1958f.cloudfunctions.net/api";

function API(baseUrl) {
    this.baseUrl = baseUrl;
}

API.prototype.listPixel = function () {
    return fetch(baseUrl + '/stat', {
        method: 'GET'
    }).then(function (res) {
        return res.json();
    });
};

API.prototype.listClickForPixel = function (pixelId) {
    return fetch(baseUrl + '/click/' + pixelId, {
        method: 'GET'
    }).then(function (res) {
        return res.json();
    });
};

const api = new API(baseUrl);

function Helper() {

}

Helper.prototype.getBarData = function (clicks, pixel) {
    const hourDist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    clicks.forEach((click) => {
        hourDist[(new Date(click.createAt)).getHours()]++;
    });
    console.log(hourDist);
    return {
        labels: ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
        datasets: [
            {
                label: pixel.location.city + ', ' + pixel.location.state + ' ' + pixel.data.title + ' (Posted on ' + (new Date(pixel.data.createAt)).toLocaleTimeString() + ')',
                backgroundColor: '#f87979',
                data: hourDist
            }
        ]
    };
};

const helper = new Helper();

Vue.component('bar-chart', {
    extends: VueChartJs.Line,
    mixins: [VueChartJs.mixins.reactiveProp],
    props: ['chartData', 'options'],
    mounted() {
        this.renderChart(this.chartData, {responsive: true, maintainAspectRatio: false})
    }
});

const app = new Vue({
    el: '#el',
    data: {
        pixels: [],
        selectedPixel: {},
        chartData2: null
    },
    created: function () {
        api.listPixel().then((res) => {
            this.pixels = res.pixels;
        });
    },
    methods: {
        select: function (selectedPixel) {
            this.selectedPixel = selectedPixel;
            api.listClickForPixel(selectedPixel.pixelId).then((res) => {
                this.clicks = res.clicks;
                this.chartData2 = helper.getBarData(this.clicks, selectedPixel);
            })
        }
    }
});
